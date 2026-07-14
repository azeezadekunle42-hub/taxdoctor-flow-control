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

function pick(obj: any, keys: string[]): any {
  for (const k of keys) {
    if (obj == null) return undefined;
    const parts = k.split('.');
    let cur = obj;
    let ok = true;
    for (const p of parts) {
      if (cur && typeof cur === 'object' && p in cur) cur = cur[p];
      else { ok = false; break; }
    }
    if (ok && cur !== undefined && cur !== null && cur !== '') return cur;
  }
  return undefined;
}

function mapTier(name: string): string {
  const n = (name || '').toLowerCase();
  if (n.includes('starter')) return 'Starter Control';
  if (n.includes('growth')) return 'Growth Control';
  if (n.includes('premium')) return 'Premium Control';
  return 'unknown';
}

function mapPeriod(name: string, _amountKobo: number): string {
  const n = (name || '').toLowerCase();
  if (n.includes('quarter')) return 'quarterly';
  if (n.includes('half') || n.includes('semi')) return 'half_yearly';
  if (n.includes('annual') || n.includes('year')) return 'annual';
  return 'unknown';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  // [DIAG] header names (not values — x-ghl-secret must not be logged)
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

  const email = pick(payload, ['email', 'contact.email', 'customer.email', 'contact_email', 'buyer_email']);
  const invoiceId = pick(payload, ['invoice_id', 'invoiceId', 'invoice.id', 'id']);
  const productName = pick(payload, ['product_name', 'productName', 'product', 'line_item', 'lineItem.name', 'items.0.name', 'invoice.line_items.0.name']) || '';
  const paystackRef = pick(payload, ['paystack_reference', 'paystackReference', 'reference', 'transaction_reference', 'payment_reference']);
  const amountRaw = pick(payload, ['amount_kobo', 'amount', 'invoice.amount', 'total', 'invoice.total']);

  if (!email || !invoiceId || amountRaw === undefined) {
    console.warn('ghl-order-ingest: missing required fields', { hasEmail: !!email, hasInvoice: !!invoiceId, hasAmount: amountRaw !== undefined });
    return new Response(JSON.stringify({ error: 'Missing email, invoice_id, or amount' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Amount: accept naira or kobo. Heuristic — integers >= 100000 with no fractional part are already kobo;
  // otherwise treat as naira and convert.
  const num = Number(amountRaw);
  if (!isFinite(num) || num <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid amount' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const looksLikeKobo = Number.isInteger(num) && num >= 100000;
  const amount_kobo = looksLikeKobo ? num : Math.round(num * 100);

  const tier = mapTier(productName);
  const plan_period = mapPeriod(productName, amount_kobo);
  console.log('[ghl-diag] extracted:', {
    email, invoiceId, amountRaw, amount_kobo, productName,
    tier, tierOk: tier !== 'unknown',
    plan_period, planPeriodOk: plan_period !== 'unknown',
    paystackRef,
  });
  if (tier === 'unknown' || plan_period === 'unknown') {
    console.warn('ghl-order-ingest: mapping incomplete', { productName, tier, plan_period });
  }

  const reference = paystackRef ? String(paystackRef) : `ghl:${invoiceId}`;
  const paidAt = new Date().toISOString();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Idempotency: check by reference first.
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
  if (existing) {
    if (existing.status === 'paid') {
      alreadyPaid = true;
    } else {
      const { error: updErr } = await supabase
        .from('orders')
        .update({ email, tier, plan_period, amount_kobo, status: 'paid', paid_at: paidAt, source: 'ghl' })
        .eq('reference', reference);
      if (updErr) {
        console.error('order update error', updErr);
        return new Response(JSON.stringify({ error: 'DB error' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
  } else {
    const { error: insErr } = await supabase.from('orders').insert({
      reference, email, tier, plan_period, amount_kobo,
      status: 'paid', paid_at: paidAt, source: 'ghl',
    });
    if (insErr) {
      // Race: another delivery inserted concurrently — treat as duplicate.
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
  // GHL CRM push-back — never block the 200 back to GHL.
  // API base: https://services.leadconnectorhq.com  (LeadConnector v2)
  // Endpoints used:
  //   GET  /contacts/?locationId=...&query=<email>   (lookup by email)
  //   POST /contacts/                                (create if not found)
  //   POST /contacts/{id}/tags                       (add tags)
  //   PUT  /contacts/{id}                            (update custom field)
  // Failure policy: any GHL call failure is logged (endpoint, status, body)
  // and swallowed. The order is already recorded; we still return 200.
  // Date format for the custom field: "YYYY-MM-DD" (ISO calendar date).
  // ============================================================
  try {
    const ghlToken = Deno.env.get('GHL_API_TOKEN');
    const locationId = Deno.env.get('GHL_LOCATION_ID');
    if (!ghlToken || !locationId) {
      console.warn('[ghl-sync] skipping — GHL_API_TOKEN or GHL_LOCATION_ID missing');
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
            method,
            headers: ghlHeaders,
            body: body ? JSON.stringify(body) : undefined,
          });
          const text = await res.text();
          if (!res.ok) {
            console.error(`[ghl-sync] ${method} ${path} -> ${res.status}`, text);
          } else {
            console.log(`[ghl-sync] ${method} ${path} -> ${res.status}`);
          }
          let json: any = null;
          try { json = text ? JSON.parse(text) : null; } catch { /* non-JSON */ }
          return { ok: res.ok, status: res.status, body: text, json };
        } catch (e) {
          console.error(`[ghl-sync] ${method} ${path} threw:`, e);
          return { ok: false, status: 0, body: String(e), json: null };
        }
      }

      // 1. Lookup contact by email
      let contactId: string | null = null;
      const lookup = await ghlCall(
        'GET',
        `/contacts/?locationId=${encodeURIComponent(locationId)}&query=${encodeURIComponent(email)}`,
      );
      if (lookup.ok && lookup.json?.contacts?.length) {
        // Prefer exact email match
        const match = lookup.json.contacts.find(
          (c: any) => (c.email || '').toLowerCase() === email.toLowerCase(),
        ) || lookup.json.contacts[0];
        contactId = match?.id || null;
      }

      // 2. Create contact if missing
      if (!contactId) {
        const created = await ghlCall('POST', '/contacts/', {
          locationId,
          email,
          source: 'FCS GHL Ingest',
        });
        contactId = created.json?.contact?.id || created.json?.id || null;
        if (!contactId) {
          console.warn('[ghl-sync] could not resolve contactId after create; skipping tag/field updates');
        }
      }

      if (contactId) {
        // 3. Build tag from mapped tier + period (fallback pieces if unknown)
        const tierSlug = tier.toLowerCase().replace(/\s+control$/, '').replace(/\s+/g, '-');
        const periodSlug = plan_period.replace(/_/g, '-');
        const productTag = `fcs-${tierSlug}-${periodSlug}`;

        // 3a. Add tags (product + fcs-client)
        await ghlCall('POST', `/contacts/${contactId}/tags`, {
          tags: [productTag, 'fcs-client'],
        });

        // 3b. Update custom field "FCS Next Invoice Date"
        const monthsAhead =
          plan_period === 'quarterly' ? 3 :
          plan_period === 'half_yearly' ? 6 :
          plan_period === 'annual' ? 12 :
          plan_period === 'monthly' ? 1 : 0;
        if (monthsAhead > 0) {
          const paid = new Date(paidAt);
          const next = new Date(paid);
          next.setUTCMonth(next.getUTCMonth() + monthsAhead);
          const nextDateStr = next.toISOString().slice(0, 10); // YYYY-MM-DD
          console.log('[ghl-sync] next_invoice_date computed:', nextDateStr, `(${plan_period}, +${monthsAhead}mo)`);

          await ghlCall('PUT', `/contacts/${contactId}`, {
            customFields: [
              { key: 'contact.next_invoice_date', field_value: nextDateStr },
            ],
          });
        } else {
          console.warn('[ghl-sync] plan_period unknown — skipping next_invoice_date update');
        }
      }
    }
  } catch (e) {
    console.error('[ghl-sync] threw (swallowed):', e);
  }

  return new Response(JSON.stringify({ ok: true, reference, tier, plan_period, amount_kobo }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});

