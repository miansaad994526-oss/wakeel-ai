export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  try {
    const { files, toolId, fields } = await req.json();
    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ error: 'No files uploaded.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    const LAWYER_ONLY = new Set(['f0', 'f9']);
    const contentBlocks = [];
    for (const file of files) {
      const mediaType = file.mediaType || file.type || 'image/jpeg';
      if (mediaType === 'application/pdf') {
        contentBlocks.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: file.data } });
      } else {
        contentBlocks.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: file.data } });
      }
    }
    const extractableFields = (fields || []).filter(f => !LAWYER_ONLY.has(f.id) && f.type !== 'select');
    const fieldList = extractableFields.map(f =>
      '"' + f.id + '": ' + f.label + (f.placeholder ? ' (e.g. ' + f.placeholder + ')' : '')
    ).join('\n');
    contentBlocks.push({ type: 'text', text: 'You are a Pakistani legal document extraction assistant. Read the uploaded document(s) and extract information to fill these fields for a ' + (toolId || 'legal') + ' document.\n\nFIELDS TO FILL:\n' + fieldList + '\n\nRULES:\n- Extract ONLY information explicitly present in the documents.\n- Do NOT invent or assume any information.\n- If a field cannot be determined, use "".\n- For party details: include full name, father name, CNIC, address.\n- For property: include plot number, area, location, mouza, tehsil, district.\n- For amounts: include Rs. prefix.\n\nReturn ONLY a valid JSON object, nothing else. Example: {"f2": "value", "f3": "value"}' });
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'pdfs-2024-09-25'
      },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, messages: [{ role: 'user', content: contentBlocks }] })
    });
    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      return new Response(JSON.stringify({ error: 'API error ' + response.status + ': ' + errBody }), { status: response.status, headers: { 'Content-Type': 'application/json' } });
    }
    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return new Response(JSON.stringify({ error: 'Could not parse extraction result' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    const extracted = JSON.parse(jsonMatch[0]);
    return new Response(JSON.stringify(extracted), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Extraction failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
