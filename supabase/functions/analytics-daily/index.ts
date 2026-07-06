import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

// Africa/Lagos is UTC+1, no DST.
const LAGOS_OFFSET_MS = 60 * 60 * 1000;

function todayInLagos(): string {
  const now = new Date(Date.now() + LAGOS_OFFSET_MS);
  return now.toISOString().slice(0, 10);
}

function lagosDayBoundsUtc(dateStr: string): { startUtc: string; endUtc: string } {
  // Lagos day [00:00, 24:00) => UTC [date-01:00, date+1-01:00)
  const start = new Date(`${dateStr}T00:00:00.000Z`).getTime() - LAGOS_OFFSET_MS;
  const end = start + 24 * 60 * 60 * 1000;
  return { startUtc: new Date(start).toISOString(), endUtc: new Date(end).toISOString() };
}

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(`${s}T00:00:00Z`).getTime());
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const expected = Deno.env.get('FCS_ANALYTICS_TOKEN');
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!expected || !token || token !== expected) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  const dateParam = url.searchParams.get('date');
  const date = dateParam && isValidDate(dateParam) ? dateParam : todayInLagos();
  const { startUtc, endUtc } = lagosDayBoundsUtc(date);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Created that day (any status)
  const createdQ = supabase
    .from('orders')
    .select('status,amount_kobo', { count: 'exact' })
    .gte('created_at', startUtc)
    .lt('created_at', endUtc);

  // Paid that day
  const paidQ = supabase
    .from('orders')
    .select('amount_kobo', { count: 'exact' })
    .eq('status', 'paid')
    .gte('paid_at', startUtc)
    .lt('paid_at', endUtc);

  // Pending created that day (leads)
  const pendingCreatedQ = supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
    .gte('created_at', startUtc)
    .lt('created_at', endUtc);

  // Failed that day (best effort by updated_at)
  const failedQ = supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'failed')
    .gte('updated_at', startUtc)
    .lt('updated_at', endUtc);

  // Abandoned checkouts: pending, older than 2h, email present
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const abandonedQ = supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
    .lt('created_at', twoHoursAgo)
    .not('email', 'is', null)
    .neq('email', '');

  const [createdRes, paidRes, pendingCreatedRes, failedRes, abandonedRes] = await Promise.all([
    createdQ, paidQ, pendingCreatedQ, failedQ, abandonedQ,
  ]);

  const checkoutsStarted = createdRes.count ?? 0;
  const paymentsCompleted = paidRes.count ?? 0;
  const paymentsFailed = failedRes.count ?? 0;
  const leads = pendingCreatedRes.count ?? 0;
  const revenueTodayKobo = (paidRes.data ?? []).reduce((s, r: any) => s + (r.amount_kobo || 0), 0);
  const revenueToday = revenueTodayKobo / 100;
  const abandonedCount = abandonedRes.count ?? 0;

  const opportunities = abandonedCount > 0 ? [{
    id: 'opp:abandoned-checkout:v1',
    headline: `${abandonedCount} abandoned checkouts with contact emails`,
    suggested_action: 'Follow up by email/WhatsApp — they chose a tier and entered their email',
    count: abandonedCount,
  }] : [];

  const body = {
    date,
    summary: {
      visitors: null,
      leads,
      registrations: null,
      activated: null,
      subscribers: paymentsCompleted,
      revenue_today: revenueToday,
      mrr: 0,
    },
    funnel: [
      { stage: 'checkout_started', count: checkoutsStarted },
      { stage: 'paid', count: paymentsCompleted },
    ],
    events: {
      checkouts_started: checkoutsStarted,
      payments_completed: paymentsCompleted,
      payments_failed: paymentsFailed,
    },
    opportunities,
  };

  return new Response(JSON.stringify(body), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
