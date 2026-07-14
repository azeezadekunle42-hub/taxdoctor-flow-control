import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-ghl-secret',
};

const FROM = 'TaxDoctor <noreply@mail.taxdoctor.com.ng>';

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function sendEmail(to: string, subject: string, html: string) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) return { ok: false, status: 0, body: 'RESEND_API_KEY missing' };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  return { ok: res.ok, status: res.status, body: await res.text() };
}

function mapTier(name: string): string {
  const n = (name || '').toLowerCase();
  if (n.includes('starter')) return 'Starter Control';
  if (n.includes('growth')) return 'Growth Control';
  if (n.includes('premium')) return 'Premium Control';
  return 'unknown';
}

function mapPeriod(name: string): string {
  const n = (name || '').toLowerCase();
  if (n.includes('quarter')) return 'quarterly';
  if (n.includes('half') || n.includes('semi')) return 'half_yearly';
  if (n.includes('annual') || n.includes('year')) return 'annual';
  return 'unknown';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  // [DIAG] header names
  const headerNames: string[] = [];
  req.headers.forEach((_v, k) => headerNames.push(k));
  console.log('[ghl-diag] header names:', headerNames);

  const expected = Deno.env.get('GHL_INGEST_SECRET') || '';
  const provided = req.headers.get('x-ghl-secret') || '';
  if (!expected || !provided || !timingSafeEqual(expected, provided)) {
    console.log('[ghl-diag] auth failed', { hasExpected: !!expected, hasProvided: !!provided });
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const rawBody = await req.text();
  console.log('[ghl-diag] raw body:', rawBody);
  let payload: any;
  try { payload = JSON.parse(rawBody); } catch {
    console.log('[ghl-diag] JSON parse failed');
    return new Response(JSON.stringify({ error: 'Bad JSON' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // === Extraction (exact paths from real GHL payload) ===
  const inv = payload?.invoice?._data || {};
  const invRoot = payload?.invoice || {};
  const item0 = Array.isArray(inv.invoiceItems) ? inv.invoiceItems[0] : undefined;

  const email: string | undefined =
    payload?.email || inv?.contactDetails?.email;
  const contactId: string | undefined = payload?.contact_id;
  const invoiceId: string | undefined = inv?._id || invRoot?._id;
  const productName: string = item0?.name || '';
  const currency: string | undefined = inv?.currency;
  const paidAtRaw: string | undefined = inv?.lastPaidAt;

  // All amounts are NAIRA. No kobo heuristic.
  const totalPaidN = Number(inv?.amountPaid ?? inv?.total ?? inv?.invoiceTotal);
  const subtotalN = Number(inv?.totalSummary?.subTotal);
  const taxN = Number(inv?.totalSummary?.tax);

  if (!email || !invoiceId || !isFinite(totalPaidN) || totalPaidN <= 0) {
    console.warn('ghl-order-ingest: missing required fields', {
      hasEmail: !!email, hasInvoice: !!invoiceId, hasTotalPaid: isFinite(totalPaidN) && totalPaidN > 0,
    });
    return new Response(JSON.stringify({ error: 'Missing email, invoice_id, or amount' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const amount_kobo = Math.round(totalPaidN * 100);
  const subtotal_kobo = isFinite(subtotalN) && subtotalN > 0 ? Math.round(subtotalN * 100) : null;
  const tax_kobo = isFinite(taxN) && taxN >= 0 ? Math.round(taxN * 100) : null;

  const tier = mapTier(productName);
  const plan_period = mapPeriod(productName);
  console.log('[ghl-diag] extracted:', {
    email, contactId, invoiceId, productName, currency,
    totalPaidN, subtotalN, taxN,
    amount_kobo, subtotal_kobo, tax_kobo,
    tier, tierOk: tier !== 'unknown',
    plan_period, planPeriodOk: plan_period !== 'unknown',
  });
  if (tier === 'unknown' || plan_period === 'unknown') {
    console.warn('ghl-order-ingest: mapping incomplete', { productName, tier, plan_period });
  }

  const reference = `ghl:${invoiceId}`;
  const paidAt = paidAtRaw && !isNaN(new Date(paidAtRaw).getTime())
    ? new Date(paidAtRaw).toISOString()
    : new Date().toISOString();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Idempotency by reference.
  const { data: existing, error: fetchErr } = await supabase
    .from('orders')
    .select('id, status')
    .eq('reference', reference)
    .maybeSingle();

  if (fetchErr) {
    console.error('order lookup error', fetchErr);
    return new Response(JSON.stringify({ error: 'DB error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let alreadyPaid = false;
  const orderFields = {
    email, tier, plan_period, amount_kobo, subtotal_kobo, tax_kobo,
    status: 'paid' as const, paid_at: paidAt, source: 'ghl' as const,
  };

  if (existing) {
    if (existing.status === 'paid') {
      alreadyPaid = true;
    } else {
      const { error: updErr } = await supabase
        .from('orders')
        .update(orderFields)
        .eq('reference', reference);
      if (updErr) {
        console.error('order update error', updErr);
        return new Response(JSON.stringify({ error: 'DB error' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
  } else {
    const { error: insErr } = await supabase.from('orders').insert({ reference, ...orderFields });
    if (insErr) {
      if (String(insErr.code) === '23505') {
        alreadyPaid = true;
      } else {
        console.error('order insert error', insErr);
        return new Response(JSON.stringify({ error: 'DB error' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
  }

  if (alreadyPaid) {
    return new Response(JSON.stringify({ ok: true, duplicate: true, reference }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Emails — never block a 200.
  try {
    const amountStr = formatNaira(amount_kobo);
    const buyerHtml = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111;">
        <h2>Payment received — welcome to the Financial Control System</h2>
        <p>Hi,</p>
        <p>Thank you for your payment. Here are your order details:</p>
        <table style="border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:6px 12px;color:#555;">Tier</td><td style="padding:6px 12px;font-weight:bold;">${tier}</td></tr>
          <tr><td style="padding:6px 12px;color:#555;">Plan</td><td style="padding:6px 12px;font-weight:bold;">${plan_period}</td></tr>
          <tr><td style="padding:6px 12px;color:#555;">Amount</td><td style="padding:6px 12px;font-weight:bold;">${amountStr}</td></tr>
          <tr><td style="padding:6px 12px;color:#555;">Reference</td><td style="padding:6px 12px;font-family:monospace;">${reference}</td></tr>
        </table>
        <p>We'll contact you within 1 business day to begin onboarding.</p>
        <p style="color:#555;font-size:13px;margin-top:24px;">— The TaxDoctor Team</p>
      </div>
    `;
    const buyerRes = await sendEmail(email, 'Payment received — welcome to the Financial Control System', buyerHtml);
    console.log('buyer email send:', { to: email, ok: buyerRes.ok, status: buyerRes.status });
    if (!buyerRes.ok) console.error('buyer email body:', buyerRes.body);

    const teamEmail = Deno.env.get('TEAM_NOTIFICATION_EMAIL');
    if (teamEmail) {
      const teamHtml = `
        <div style="font-family:Arial,sans-serif;max-width:560px;">
          <h3>New paid order (GHL)</h3>
          <p><b>Email:</b> ${email}<br/>
          <b>Tier:</b> ${tier}<br/>
          <b>Plan:</b> ${plan_period}<br/>
          <b>Amount:</b> ${amountStr}<br/>
          <b>Reference:</b> ${reference}<br/>
          <b>Source:</b> ghl</p>
        </div>
      `;
      const teamRes = await sendEmail(teamEmail, `New paid order — ${tier} (${amountStr})`, teamHtml);
      console.log('team email send:', { to: teamEmail, ok: teamRes.ok, status: teamRes.status });
      if (!teamRes.ok) console.error('team email body:', teamRes.body);
    }
  } catch (e) {
    console.error('email send threw:', e);
  }

  // ============================================================
  // GHL CRM push-back — use contact_id from the payload directly.
  // No lookup, no create.
  //   POST /contacts/{id}/tags   → add fcs-{tier}-{period} + fcs-client
  //   PUT  /contacts/{id}        → set custom field contact.next_invoice_date
  // Failures logged + swallowed; never block the 200.
  // ============================================================
  try {
    const ghlToken = Deno.env.get('GHL_API_TOKEN');
    if (!ghlToken) {
      console.warn('[ghl-sync] skipping — GHL_API_TOKEN missing');
    } else if (!contactId) {
      console.warn('[ghl-sync] skipping — no contact_id in payload');
    } else {
      const GHL_BASE = 'https://services.leadconnectorhq.com';
      const ghlHeaders = {
        'Authorization': `Bearer ${ghlToken}`,
        'Version': '2021-07-28',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      async function ghlCall(method: string, path: string, body?: unknown) {
        const url = `${GHL_BASE}${path}`;
        try {
          const res = await fetch(url, {
            method, headers: ghlHeaders,
            body: body ? JSON.stringify(body) : undefined,
          });
          const text = await res.text();
          if (!res.ok) console.error(`[ghl-sync] ${method} ${path} -> ${res.status}`, text);
          else console.log(`[ghl-sync] ${method} ${path} -> ${res.status}`);
          return { ok: res.ok, status: res.status, body: text };
        } catch (e) {
          console.error(`[ghl-sync] ${method} ${path} threw:`, e);
          return { ok: false, status: 0, body: String(e) };
        }
      }

      const tierSlug = tier.toLowerCase().replace(/\s+control$/, '').replace(/\s+/g, '-');
      const periodSlug = plan_period.replace(/_/g, '-');
      const productTag = `fcs-${tierSlug}-${periodSlug}`;

      await ghlCall('POST', `/contacts/${contactId}/tags`, {
        tags: [productTag, 'fcs-client'],
      });

      const monthsAhead =
        plan_period === 'quarterly' ? 3 :
        plan_period === 'half_yearly' ? 6 :
        plan_period === 'annual' ? 12 : 0;
      if (monthsAhead > 0) {
        const paid = new Date(paidAt);
        const next = new Date(paid);
        next.setUTCMonth(next.getUTCMonth() + monthsAhead);
        const nextDateStr = next.toISOString().slice(0, 10); // YYYY-MM-DD
        console.log('[ghl-sync] next_invoice_date:', nextDateStr, `(${plan_period}, +${monthsAhead}mo)`);

        // Use field ID + value shape. GHL silently ignores unknown key/field_value pairs
        // and still returns 200; only the {id,value} shape actually writes DATE fields.
        // Field: "FCS Next Invoice Date" (dataType=DATE, fieldKey=contact.next_invoice_date)
        const NEXT_INVOICE_DATE_FIELD_ID = '9dz1ZgwtmxuiFIcjNvxs';
        const putRes = await ghlCall('PUT', `/contacts/${contactId}`, {
          customFields: [
            { id: NEXT_INVOICE_DATE_FIELD_ID, value: nextDateStr },
          ],
        });

        // Verify — don't trust the 200. Read the contact back and check the field.
        const verify = await ghlCall('GET', `/contacts/${contactId}`);
        try {
          const parsed = JSON.parse(verify.body);
          const cfs = parsed?.contact?.customFields || [];
          const stored = cfs.find((c: any) => c.id === NEXT_INVOICE_DATE_FIELD_ID);
          if (stored && String(stored.value) === nextDateStr) {
            console.log('[ghl-sync] next_invoice_date verified:', stored.value);
          } else {
            console.error('[ghl-sync] next_invoice_date NOT persisted', {
              sent: nextDateStr, stored, putStatus: putRes.status,
            });
          }
        } catch (e) {
          console.error('[ghl-sync] verify parse failed:', e);
        }
      } else {
        console.warn('[ghl-sync] plan_period unknown — skipping next_invoice_date update');
      }
    }
  } catch (e) {
    console.error('[ghl-sync] threw (swallowed):', e);
  }

  return new Response(JSON.stringify({
    ok: true, reference, tier, plan_period,
    amount_kobo, subtotal_kobo, tax_kobo,
  }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
