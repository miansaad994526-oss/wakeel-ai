import Anthropic from '@anthropic-ai/sdk';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { files, toolId, fields } = await req.json();

    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ error: 'No files uploaded. Please upload at least one document.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Build vision content from uploaded files
    const contentBlocks = [];
    for (const file of files) {
      contentBlocks.push({
        type: 'image',
        source: { type: 'base64', media_type: file.mediaType || 'image/jpeg', data: file.data }
      });
    }

    // Fields the lawyer must fill themselves - never extracted
    const LAWYER_ONLY = new Set(['f0', 'f9']);

    // Build extraction prompt from field definitions
    const extractableFields = (fields || []).filter(f => !LAWYER_ONLY.has(f.id) && f.type !== 'select');
    const fieldList = extractableFields.map(f =>
      `"${f.id}": ${f.label}${f.placeholder ? ' (e.g. ' + f.placeholder + ')' : ''}`
    ).join('\n');

    contentBlocks.push({
      type: 'text',
      text: `You are a Pakistani legal document extraction assistant. Read the uploaded legal document(s) carefully and extract information to fill the following form fields for a ${toolId || 'legal'} document.

FIELDS TO FILL:
${fieldList}

RULES:
- Extract ONLY information explicitly present in the documents
- Do NOT invent, assume, or hallucinate any information
- If a field cannot be determined from the documents, use ""
- For party details: include full name, father's name, CNIC, and address
- For property details: include plot number, area, location, mouza, tehsil, district
- For documents list: name each document with its date and key identifiers
- For amounts: include full amount with Rs. prefix

Return ONLY a valid JSON object, nothing else. Example format:
{"f2": "extracted value", "f3": "extracted value", "f4": "extracted value"}`
    });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: contentBlocks }]
    });

    const text = response.content[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: 'Could not parse extraction result' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    const extracted = JSON.parse(jsonMatch[0]);
    return new Response(JSON.stringify(extracted), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Extraction failed' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
