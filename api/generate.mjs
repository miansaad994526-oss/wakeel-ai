// Wakeel AI — Edge Runtime (NO timeout on Vercel Hobby)
export const config = { runtime: 'edge' };

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ─── Lean system prompt — no conflicting rules, no wasted tokens ───
const SYSTEM_PROMPT = `You are Wakeel AI, a Pakistani legal document drafting assistant.

OUTPUT FORMAT:
- Return ONLY raw HTML using the CSS classes below. No markdown, no code fences, no \`\`\`, no explanation text.
- NEVER include <style>, <script>, <html>, <head>, or <body> tags. Only inner HTML content.
- Use the CSS classes exactly as listed — the page already has styles for them.

FACTUAL ACCURACY:
- Use ONLY the names, dates, CNIC numbers, addresses, and facts the user provides. NEVER invent parties or details.
- If uploaded document content is provided, extract facts from it.
- Only cite real Pakistani case law you are confident exists (PLD, SCMR, CLC, MLD, YLR, PCrLJ). If unsure, write "as held by the superior courts" instead.
- Cite correct statutes: CrPC for criminal, CPC for civil, Constitution for writ petitions. Never mix them.
- Leave date blanks as "________________" unless the user gave a specific date.

LANGUAGE & STYLE:
- Formal Pakistani legal English: "Hon'ble Court", "Respectfully Sheweth", "inter alia", "malafide", "aggrieved".
- For Urdu: use Nastaleeq script, RTL, with English numerals.

CSS CLASSES TO USE:
doc-court-header, doc-court-name, doc-pet-no, doc-parties, doc-party-row, doc-party-name, doc-party-role, doc-versus, doc-subject, doc-sheweth, doc-para, doc-para-n, doc-section-head, doc-prayer-head, doc-prayer-intro, doc-prayer-item, doc-certificate, doc-cert-head, doc-index, doc-index-title, doc-sig-block, doc-sig-line, doc-sig-name, doc-sig-role, ri, ri-n, doc-fir-table.
Use <hr class="doc-page-break"> between companion sections (petition + affidavit + dispensation + index).`;

const TOOL_PROMPTS = {
  argument: `WRITTEN SUBMISSIONS: Court header, case ref, parties, "WRITTEN SUBMISSIONS ON BEHALF OF THE [PARTY]" heading, "Respectfully Sheweth:-", numbered paras with facts and legal analysis, "G R O U N D S" with lettered grounds (a-h+) citing law, "P R A Y E R", signature.`,
  petition: `PETITION FILING PACKAGE — 4 sections separated by <hr class="doc-page-break">:
1. MAIN PETITION: court header, parties, subject, sheweth, 10+ numbered paras, GROUNDS (a-j), PRAYER, signature, certificate.
2. AFFIDAVIT with verification.
3. DISPENSATION APPLICATION.
4. INDEX table.`,
  writ: `WRIT PETITION PACKAGE — 5 sections separated by <hr class="doc-page-break">:
1. URGENCY APPLICATION to Deputy Registrar.
2. MAIN WRIT PETITION under Article 199, Constitution 1973.
3. AFFIDAVIT with verification.
4. DISPENSATION APPLICATION.
5. INDEX table.`,
  bail: `BAIL APPLICATION PACKAGE — 4 sections separated by <hr class="doc-page-break">:
1. BAIL PETITION with FIR details table, facts, 10-14 grounds, prayer.
2. AFFIDAVIT with verification.
3. DISPENSATION APPLICATION u/s 561-A CrPC.
4. INDEX table.`,
  plaint: `PLAINT / CIVIL SUIT under Order VII CPC: court header, parties, subject, numbered paras (cause of action, limitation, jurisdiction, valuation), prayer, verification.`,
  appeal: `APPEAL / REVISION PETITION: court header, parties, MEMORANDUM OF APPEAL, facts, grounds (a-j), prayer, certificate. Then AFFIDAVIT on new page.`,
  'legal-notice': `LEGAL NOTICE (letter format, NOT court document): advocate letterhead, "LEGAL NOTICE" heading, addressee, numbered paras, demand with deadline, consequences, signature.`,
  affidavit: `SWORN AFFIDAVIT: court header (if for court), deponent details, numbered sworn paragraphs, verification clause.`,
  complaint: `CRIMINAL COMPLAINT PACKAGE — 4 sections separated by <hr class="doc-page-break">:
1. COMPLAINT u/s 200 or 156(3) CrPC with facts and prayer.
2. AFFIDAVIT.
3. DISPENSATION.
4. INDEX.`,
  'legal-opinion': `BANKING PROPERTY LEGAL OPINION — Pakistani bank mortgage/loan facility format. Generate in this EXACT structure:

1. ADVOCATE LETTERHEAD: Advocate name, qualification (Advocate High Court / Supreme Court), office address, phone, email — centered at top.

2. REFERENCE & DATE (right-aligned): "Ref No. ___/[year]" and "Dated: [date]"

3. ADDRESSEE BLOCK:
   The [Division/Branch Head Title],
   [Bank Name],
   [Branch/Regional Office Address].

4. SUBJECT LINE (bold): "Subject: LEGAL OPINION OF [CLIENT/COMPANY NAME]"

5. OPENING PARAGRAPH: "[Client/Company] has applied to [Bank] for [facility type e.g. Running Finance / Term Finance / LTFF] of Rs. [amount] and has offered the property described below as security/collateral. I have examined the following documents relating to the title of the said property."

6. DESCRIPTION OF PROPERTY:
   Heading: "DESCRIPTION OF PROPERTY"
   State property type, location (Khewat No., Khasra No., Mauzah, Tehsil, District).
   Numbered paragraphs (1, 2, 3...) showing COMPLETE CHAIN OF TITLE — each entry: who transferred to whom, type of deed/mutation, date, registration/attestation reference.

7. DOCUMENTS EXAMINED:
   Heading: "DOCUMENTS EXAMINED"
   Lettered list (i, ii, iii, iv...):
   i. NEC (No Encumbrance Certificate) from [authority]
   ii. PT-1 / Fard Malkiat (Record of Rights/Jamabandi)
   iii. Site Plan / Aks Shajra
   iv. Completion Certificate (if built-up property)
   v. Chain documents (sale deeds, mutation extracts, transfer letters)
   vi. Valuation/Inspection Report
   vii. Agreement to Create Mortgage
   viii. Any other documents provided

8. MY OPINION:
   Heading: "MY OPINION"
   Seven numbered paragraphs:
   1. The title of [owner] to the subject property is clear, genuine and marketable.
   2. The property is free from all encumbrances, charges, mortgages, liens, attachments and adverse claims as verified from the documents.
   3. All documents in the chain of title are genuine, duly executed, registered/attested and legally valid under applicable Pakistani law.
   4. The chain of ownership from original allottee/owner to the present owner is complete and unbroken.
   5. The bank can safely accept the subject property as security and create an equitable/registered mortgage in its favour.
   6. In case of default, the bank will be able to enforce its security and sell/dispose of the property without legal impediment.
   7. [Specific conditions/caveats: e.g. "Fresh NEC must be obtained before disbursement", "Mutation in client's name should be completed", "Completion certificate to be obtained" — or "No adverse remarks noted."]

9. CLOSING: "The above opinion is based solely on the documents supplied to me for examination. I have not conducted a physical inspection of the property. This opinion is issued for the use of [Bank Name] only."

10. SIGNATURE BLOCK (doc-sig-block): Advocate's name, enrollment number, date.

Use doc-sig-block, doc-sig-line, doc-sig-name, doc-sig-role for signature.
Use ALL names, amounts, property details, dates from uploaded documents and user fields. Do NOT invent property details.`
  agreement: `LEGAL AGREEMENT under Contract Act 1872: title, parties with CNIC, WHEREAS recitals, 12-15 numbered clauses, signatures, witnesses.`,
  deed: `SALE/TRANSFER DEED: title, parties with CNIC, WHEREAS, deed clauses (1-10), schedule of property, boundaries, signatures, witnesses.`,
  poa: `POWER OF ATTORNEY / WAKAALAT NAMA: title, appointing clause, numbered powers (1-6), signatures.`,
  application: `FORMAL APPLICATION — detect type from context. For court: header, case title, heading, sheweth, facts, prayer, signature. For government: addressee, subject, body, signature.`,
  mou: `MOU: title, parties, WHEREAS recitals, numbered articles (1-10+), signatures, witnesses.`
};

function buildUserPrompt(tool, fields, lang, toolTitle) {
  const entries = Object.entries(fields)
    .filter(([k, v]) => v && typeof v === 'string' && v.trim() && k !== 'uploadedDocContent')
    .map(([k, v]) => `${k}: ${v.trim()}`)
    .join('\n');

  const langNote = lang === 'ur'
    ? 'LANGUAGE: Urdu (Nastaleeq, RTL). Numbers in English, text in Urdu.'
    : 'LANGUAGE: Formal Pakistani legal English.';

  let docSection = '';
  if (fields.uploadedDocContent) {
    docSection = `\n\nUPLOADED DOCUMENT CONTENT (primary source of facts):\n---\n${fields.uploadedDocContent.substring(0, 8000)}\n---`;
  }

  return `Generate a ${toolTitle}.\n\n${langNote}\n\nDETAILS:\n${entries}${docSection}\n\nReturn complete HTML now. Use ONLY the facts above.`;
}

// ─── Sanitize AI output: strip code fences, dangerous tags ───
function sanitizeHtml(raw) {
  let html = raw
    .replace(/^[\s\S]*?```html?\s*/i, '')   // strip everything before ```html
    .replace(/```[\s]*$/i, '')               // strip closing ```
    .trim();
  // If no code fence was found, use raw (AI followed instructions)
  if (html === raw.trim()) html = raw.trim();
  // Remove dangerous tags that break page layout
  html = html
    .replace(/<\/?(?:html|head|body|meta|link|script|style)[^>]*>/gi, '')
    .replace(/<!\s*DOCTYPE[^>]*>/gi, '');
  return html;
}

// ─── Build content blocks from attached files ───
function buildFileContentBlocks(attachedFiles) {
  const blocks = [];
  if (!attachedFiles || !attachedFiles.length) return blocks;
  for (const file of attachedFiles) {
    if (!file.data || file.data.length < 100) continue;
    const isImage = /^image\//i.test(file.type);
    const isPDF = file.type === 'application/pdf' || (file.name && file.name.toLowerCase().endsWith('.pdf'));
    if (isImage) {
      blocks.push({ type: 'image', source: { type: 'base64', media_type: file.type, data: file.data } });
    } else if (isPDF) {
      blocks.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: file.data } });
    }
  }
  return blocks;
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.json();
    const { tool, fields, lang, toolTitle, attachedFiles, mode } = body;

    if (!tool || !fields) {
      return new Response(JSON.stringify({ error: 'Missing tool or fields' }), {
        status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    // EXTRACT MODE - returns JSON (not streaming)
    if (mode === 'extract') {
      if (!attachedFiles || !attachedFiles.length) {
        return new Response(JSON.stringify({ error: 'No files provided' }), {
          status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }
      const file = attachedFiles[0];
      if (!file.data || file.data.length < 100) {
        return new Response(JSON.stringify({ error: 'File data is empty or corrupted. Re-upload.' }), {
          status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }

      const msgContent = [];
      const isImage = /^image\//i.test(file.type);
      const isPDF = file.type === 'application/pdf' || (file.name && file.name.toLowerCase().endsWith('.pdf'));

      if (isImage) {
        msgContent.push({ type: 'image', source: { type: 'base64', media_type: file.type, data: file.data } });
      } else if (isPDF) {
        msgContent.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: file.data } });
      } else {
        return new Response(JSON.stringify({ error: 'Only PDF and image files are supported' }), {
          status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }

      msgContent.push({ type: 'text', text: `Extract information from this document to fill a "${toolTitle || tool}" form.\n\nReturn ONLY a JSON object with these field IDs as keys:\n${fields.fieldSchema}\n\nAlso include "__docText__" with a comprehensive plain-text extraction (max 6000 chars) of ALL content in the document — include every name, date, CNIC, address, amount, clause, and detail you can find.\n\nReturn ONLY valid JSON. No explanation, no markdown fences.` });

      const extractRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'pdfs-2024-09-25'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 8000,
          messages: [{ role: 'user', content: msgContent }]
        })
      });

      if (!extractRes.ok) {
        const errBody = await extractRes.text().catch(() => '');
        let msg = 'Extraction failed (' + extractRes.status + ')';
        try { const ej = JSON.parse(errBody); if (ej.error?.message) msg = ej.error.message; } catch (_) {}
        return new Response(JSON.stringify({ error: msg }), {
          status: extractRes.status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }

      const extractData = await extractRes.json();
      const rawText = extractData.content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('')
        .trim()
        .replace(/^```json?\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      try {
        const parsed = JSON.parse(rawText);
        return new Response(JSON.stringify({ extracted: parsed, usage: extractData.usage }), {
          status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      } catch (_) {
        return new Response(JSON.stringify({ extracted: {}, raw: rawText }), {
          status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }
    }

    // GENERATE / REFINE MODE - streaming SSE
    let systemPrompt, userPrompt;

    if (tool === '__refine__') {
      systemPrompt = SYSTEM_PROMPT + '\n\nYou are refining an existing document. Output the COMPLETE refined HTML. Only change what the lawyer asked. Keep all CSS classes and page breaks.';
      userPrompt = `Current document HTML:\n${(fields.currentDoc || '').substring(0, 12000)}\n\n${fields.targetDesc || ''}\n\nLAWYER INSTRUCTION: ${fields.instruction}\n\nOutput the complete refined HTML now.`;
    } else {
      const toolPrompt = TOOL_PROMPTS[tool] || TOOL_PROMPTS['application'];
      systemPrompt = SYSTEM_PROMPT + '\n\nDOCUMENT TYPE:\n' + toolPrompt;
      userPrompt = buildUserPrompt(tool, fields, lang, toolTitle || tool);
    }

    // ─── BUILD MESSAGE CONTENT ───
    // If attached files are present, include them as content blocks so the AI
    // can read the FULL document (not just the extracted text summary).
    const fileBlocks = buildFileContentBlocks(attachedFiles);
    let messageContent;
    if (fileBlocks.length > 0) {
      // Multi-part message: file blocks + text prompt
      messageContent = [...fileBlocks, { type: 'text', text: userPrompt }];
    } else {
      messageContent = userPrompt;
    }

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'pdfs-2024-09-25'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{ role: 'user', content: messageContent }],
        stream: true
      })
    });

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text().catch(() => '');
      return new Response(JSON.stringify({ error: 'API error (' + anthropicRes.status + ')', details: errBody }), {
        status: anthropicRes.status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    // Stream Anthropic SSE to client SSE with sanitization
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      const reader = anthropicRes.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let fullText = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() || '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (!raw || raw === '[DONE]') continue;
            try {
              const evt = JSON.parse(raw);
              if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
                const chunk = evt.delta.text;
                fullText += chunk;
                await writer.write(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
              }
            } catch (_) {}
          }
        }
        // Send a done signal so the client knows streaming is complete
        await writer.write(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } catch (e) {
        try { await writer.write(encoder.encode(`data: ${JSON.stringify({ error: e.message })}\n\n`)); } catch (_) {}
      } finally {
        try { await writer.close(); } catch (_) {}
      }
    })();

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...CORS_HEADERS
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server error: ' + error.message }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }
}
