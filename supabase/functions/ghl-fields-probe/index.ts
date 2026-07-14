const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const token = Deno.env.get('GHL_API_TOKEN')!;
  const locId = Deno.env.get('GHL_LOCATION_ID')!;
  const contactId = 'zCuHwqFrsdUuVcuS0oTb';
  const BASE = 'https://services.leadconnectorhq.com';
  const H = {
    'Authorization': `Bearer ${token}`,
    'Version': '2021-07-28',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  const url = new URL(req.url);
  const mode = url.searchParams.get('mode') || 'list';

  if (mode === 'list') {
    const r = await fetch(`${BASE}/locations/${locId}/customFields`, { headers: H });
    const body = await r.text();
    return new Response(body, { status: r.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  if (mode === 'test') {
    const fieldId = url.searchParams.get('fieldId')!;
    const attempts = [
      { label: 'iso-datetime', value: '2026-10-14T00:00:00.000Z' },
      { label: 'date-only', value: '2026-10-14' },
      { label: 'epoch-ms', value: 1760400000000 },
    ];
    const results: any[] = [];
    for (const a of attempts) {
      const putRes = await fetch(`${BASE}/contacts/${contactId}`, {
        method: 'PUT',
        headers: H,
        body: JSON.stringify({ customFields: [{ id: fieldId, value: a.value }] }),
      });
      const putBody = await putRes.text();

      const getRes = await fetch(`${BASE}/contacts/${contactId}`, { headers: H });
      const getBody = await getRes.text();
      let parsed: any = null;
      try { parsed = JSON.parse(getBody); } catch {}
      const cfs = parsed?.contact?.customFields || parsed?.customFields || [];
      const stored = cfs.find((c: any) => c.id === fieldId);
      results.push({
        attempt: a.label,
        sent: a.value,
        putStatus: putRes.status,
        putBody: putBody.slice(0, 500),
        readBack: stored ?? null,
        allCustomFieldsMatchingId: cfs.filter((c: any) => c.id === fieldId),
      });
    }
    return new Response(JSON.stringify({ contactId, fieldId, results }, null, 2), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response('unknown mode', { status: 400, headers: corsHeaders });
});
