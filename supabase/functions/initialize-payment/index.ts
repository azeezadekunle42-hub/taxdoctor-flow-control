import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ALLOWED_CALLBACK_ORIGINS = [
  'https://training.taxdoctor.com.ng',
  'https://cfo.taxdoctorcapture.org',
  'https://taxdoctor-flow-control.lovable.app',
  'https://id-preview--a6193a76-179a-4651-b03f-d6b670fe8f1a.lovable.app',
];
const DEFAULT_CALLBACK = 'https://cfo.taxdoctorcapture.org/payment-verification';

function pickCallbackUrl(requested: string | undefined): string {
  if (!requested) return DEFAULT_CALLBACK;
  try {
    const u = new URL(requested);
    if (ALLOWED_CALLBACK_ORIGINS.includes(u.origin)) return requested;
  } catch { /* fallthrough */ }
  return DEFAULT_CALLBACK;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, amount, plan, tier, callback_url } = await req.json();

    if (!email || !amount || !plan || !tier) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, amount, plan, tier' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!PAYSTACK_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: 'Payment configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const safeCallback = pickCallbackUrl(callback_url);
    const origin = req.headers.get('origin') || req.headers.get('referer') || 'unknown';

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Paystack expects amount in kobo
        callback_url: safeCallback,
        metadata: { plan, tier, source: origin },
      }),
    });

    const data = await response.json();

    if (!data.status) {
      return new Response(
        JSON.stringify({ error: data.message || 'Failed to initialize transaction' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert pending order row (best-effort — do not block payment on this)
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );
      await supabase.from('orders').insert({
        reference: data.data.reference,
        email,
        tier,
        plan_period: plan,
        amount_kobo: amount * 100,
        status: 'pending',
        source: origin,
      });
    } catch (e) {
      console.error('Failed to insert order row:', e);
    }

    return new Response(
      JSON.stringify({ authorization_url: data.data.authorization_url, reference: data.data.reference }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('initialize-payment error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
