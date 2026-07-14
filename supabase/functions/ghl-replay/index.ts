const corsHeaders = { 'Access-Control-Allow-Origin': '*' };

Deno.serve(async () => {
  const secret = Deno.env.get('GHL_INGEST_SECRET')!;
  const supaUrl = Deno.env.get('SUPABASE_URL')!;
  const payload = {
    contact_id: 'zCuHwqFrsdUuVcuS0oTb',
    email: 'kayokunola11@gmail.com',
    invoice: {
      _id: '6a567d128179ecb5d8c2b6b2',
      _data: {
        _id: '6a567d128179ecb5d8c2b6b2',
        status: 'paid',
        currency: 'NGN',
        contactDetails: { email: 'kayokunola11@gmail.com' },
        invoiceItems: [{ name: 'Starter Control - Quarterly', amount: 225000 }],
        amountPaid: 241875,
        total: 241875,
        totalSummary: { subTotal: 225000, tax: 16875 },
        lastPaidAt: '2026-07-14T18:23:56.227Z',
      },
    },
  };
  const r = await fetch(`${supaUrl}/functions/v1/ghl-order-ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-ghl-secret': secret },
    body: JSON.stringify(payload),
  });
  const text = await r.text();
  return new Response(JSON.stringify({ status: r.status, body: text }, null, 2),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
