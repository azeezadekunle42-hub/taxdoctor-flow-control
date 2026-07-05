import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-paystack-signature',
};

const FROM = 'TaxDoctor <noreply@mail.taxdoctor.com.ng>';

async function verifySignature(secret: string, rawBody: string, signature: string): Promise<boolean> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign'],
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(rawBody));
  const computed = Array.from(new Uint8Array(sigBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  // Constant-time-ish compare
  if (computed.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<{ ok: boolean; status: number; body: string }> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) return { ok: false, status: 0, body: 'RESEND_API_KEY missing' };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
  if (!PAYSTACK_SECRET_KEY) return new Response('Server misconfigured', { status: 500, headers: corsHeaders });

  const raw = await req.text();
  const signature = req.headers.get('x-paystack-signature') || '';
  if (!signature || !(await verifySignature(PAYSTACK_SECRET_KEY, raw, signature))) {
    console.warn('paystack-webhook: invalid signature');
    return new Response('Invalid signature', { status: 401, headers: corsHeaders });
  }

  let payload: any;
  try { payload = JSON.parse(raw); } catch {
    return new Response('Bad JSON', { status: 400, headers: corsHeaders });
  }

  const event = payload?.event as string | undefined;
  const data = payload?.data ?? {};
  const reference = data?.reference as string | undefined;

  if (!reference) {
    return new Response(JSON.stringify({ ignored: true, reason: 'no reference' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Look up order — if not ours, ignore (harmless for shared Paystack account).
  const { data: order, error: fetchErr } = await supabase
    .from('orders')
    .select('*')
    .eq('reference', reference)
    .maybeSingle();

  if (fetchErr) {
    console.error('order lookup error', fetchErr);
    return new Response('DB error', { status: 500, headers: corsHeaders });
  }
  if (!order) {
    console.log('paystack-webhook: reference not ours, ignoring', reference);
    return new Response(JSON.stringify({ ignored: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (event === 'charge.success') {
    // Idempotent — only act if not already paid.
    if (order.status === 'paid') {
      return new Response(JSON.stringify({ ok: true, duplicate: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const paidAt = data?.paid_at || new Date().toISOString();
    const { error: updErr } = await supabase
      .from('orders')
      .update({ status: 'paid', paid_at: paidAt })
      .eq('reference', reference)
      .eq('status', 'pending'); // idempotency guard

    if (updErr) {
      console.error('order update error', updErr);
      return new Response('DB error', { status: 500, headers: corsHeaders });
    }

    const amountStr = formatNaira(order.amount_kobo);
    const buyerHtml = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111;">
        <h2 style="color:#111;">Payment received — welcome to the Financial Control System</h2>
        <p>Hi,</p>
        <p>Thank you for your payment. Here are your order details:</p>
        <table style="border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:6px 12px;color:#555;">Tier</td><td style="padding:6px 12px;font-weight:bold;">${order.tier}</td></tr>
          <tr><td style="padding:6px 12px;color:#555;">Plan</td><td style="padding:6px 12px;font-weight:bold;">${order.plan_period}</td></tr>
          <tr><td style="padding:6px 12px;color:#555;">Amount</td><td style="padding:6px 12px;font-weight:bold;">${amountStr}</td></tr>
          <tr><td style="padding:6px 12px;color:#555;">Reference</td><td style="padding:6px 12px;font-family:monospace;">${reference}</td></tr>
        </table>
        <p>We'll contact you within 1 business day to begin onboarding.</p>
        <p style="color:#555;font-size:13px;margin-top:24px;">— The TaxDoctor Team</p>
      </div>
    `;
    const teamEmail = Deno.env.get('TEAM_NOTIFICATION_EMAIL');
    const teamHtml = `
      <div style="font-family:Arial,sans-serif;max-width:560px;">
        <h3>New paid order</h3>
        <p><b>Email:</b> ${order.email}<br/>
        <b>Tier:</b> ${order.tier}<br/>
        <b>Plan:</b> ${order.plan_period}<br/>
        <b>Amount:</b> ${amountStr}<br/>
        <b>Reference:</b> ${reference}<br/>
        <b>Source:</b> ${order.source || 'unknown'}</p>
      </div>
    `;

    const buyerRes = await sendEmail(order.email, 'Payment received — welcome to the Financial Control System', buyerHtml);
    console.log('buyer email send:', { to: order.email, ok: buyerRes.ok, status: buyerRes.status });
    if (!buyerRes.ok) console.error('buyer email body:', buyerRes.body);

    if (teamEmail) {
      const teamRes = await sendEmail(teamEmail, `New paid order — ${order.tier} (${amountStr})`, teamHtml);
      console.log('team email send:', { to: teamEmail, ok: teamRes.ok, status: teamRes.status });
      if (!teamRes.ok) console.error('team email body:', teamRes.body);
    } else {
      console.warn('TEAM_NOTIFICATION_EMAIL not set — skipping team notification');
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (event === 'charge.failed') {
    await supabase
      .from('orders')
      .update({ status: 'failed' })
      .eq('reference', reference)
      .neq('status', 'paid');
    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ignored: true, event }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
