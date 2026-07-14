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

function mapPeriod(name: string, amountKobo: number): string {
  const n = (name || '').toLowerCase();
  if (n.includes('annual') || n.includes('yearly') || n.includes('year')) return 'annual';
  if (n.includes('half') || n.includes('semi') || n.includes('6-month') || n.includes('6 month')) return 'half_yearly';
  if (n.includes('quarter')) return 'quarterly';
  if (n.includes('month')) return 'monthly';
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

  return new Response(JSON.stringify({ ok: true, reference, tier, plan_period, amount_kobo }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
