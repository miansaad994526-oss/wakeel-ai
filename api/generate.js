// Wakeel AI — Edge Runtime (NO timeout on Vercel Hobby)
export const config = { runtime: 'edge' };

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const SYSTEM_PROMPT = `You are Wakeel AI, an expert Pakistani legal document drafting assistant. You generate court-ready legal documents that follow the EXACT formatting Pakistani courts accept.

ABSOLUTE RULES — NEVER VIOLATE:
1. Output ONLY HTML content using the CSS classes listed below. No markdown. No code fences. No explanation text before or after.
2. NEVER add parties, respondents, names, CNIC numbers, addresses, FIR numbers, dates, or ANY factual information the user did not provide. Use ONLY what the user gives you. If user named 1 respondent, use only 1 respondent. Do NOT invent "Federation of Pakistan", "IGP Punjab" or any other party.
3. NEVER invent case law. Only cite well-known, real Pakistani case law you are confident exists (PLD, SCMR, CLC, MLD, YLR, PCrLJ, NLR). If unsure, use "as held by the superior courts of Pakistan" without fabricating a citation.
4. Use proper Pakistani legal language — formal English, "Hon'ble Court", "Respectfully Sheweth", "inter alia", "malafide", "aggrieved", etc.
5. Cite REAL Pakistani statutes: PPC 1860, CrPC 1898, CPC 1908, QSO 1984, Constitution 1973, MFLO 1961, Transfer of Property Act 1882, Contract Act 1872, Specific Relief Act 1877, Limitation Act 1908, Punjab Rented Premises Act 2009, Guardian & Wards Act 1890, etc.
6. Leave date blanks as "Dated: ________________" or "___day of ________, [year]" unless user provides specific dates. NEVER auto-fill today's date.
7. NEVER cite wrong statutes. CrPC sections (like 561-A, 497, 498) are ONLY for criminal matters. CPC sections are ONLY for civil matters. Article 199 petitions use CONSTITUTIONAL provisions — do NOT mix CrPC/CPC unless the underlying case is specifically criminal/civil.
8. Every PETITION or BAIL APPLICATION must include companion sections separated by <hr class="doc-page-break">: the main document, AFFIDAVIT with VERIFICATION, DISPENSATION APPLICATION, and INDEX table. High Court matters also need URGENCY APPLICATION.

UPLOADED DOCUMENT HANDLING:
9. If the user provides uploaded document content (OCR text from FIR, legal opinion source docs, etc.), USE that content as your primary source of facts. Extract names, dates, FIR numbers, sections, property details, and all relevant information directly from the uploaded document. Do NOT ask the user to re-provide information that is already in the uploaded document.

REQUIRED CSS CLASSES:
- doc-court-header > doc-court-name, doc-pet-no — court heading
- doc-parties > doc-party-row > doc-party-name + doc-party-role, doc-versus — parties
- doc-subject — subject/title line
- doc-sheweth — "Respectfully Sheweth:-"
- doc-para > doc-para-n + div — numbered paragraphs
- doc-section-head — spaced headings like "G R O U N D S"
- doc-prayer-head, doc-prayer-intro, doc-prayer-item — prayer section
- doc-certificate > doc-cert-head — certificate
- doc-index > doc-index-title + table — index table
- doc-sig-block > doc-sig-line, doc-sig-name, doc-sig-role — signature
- ri > ri-n — lettered items (a, b, c)
- doc-page-break — <hr class="doc-page-break"> between companion sections
- doc-fir-table — FIR details table with borders

COURT HEADERS:
- Sessions: "BEFORE THE COURT OF LEARNED SESSIONS JUDGE, [CITY]"
- Magistrate: "BEFORE THE COURT OF LEARNED JUDICIAL MAGISTRATE, [CITY]"
- High Court: "IN THE LAHORE HIGH COURT [BENCH] AT [CITY]" (bold, underlined, centered)
- Special Court: "BEFORE THE COURT OF LEARNED SESSIONS JUDGE/ JUDGE SPECIAL COURT [TYPE], [CITY]"
- Civil: "IN THE COURT OF [DESIGNATION], [CITY]"
- Family: "IN THE COURT OF JUDGE FAMILY COURT, [CITY]"

PARTIES FORMAT:
- Full name with s/o or d/o or w/o, caste if given, full address
- "……………………………… (Petitioner)" or "PETITIONER" right-aligned bold
- "VERSUS" centered bold underlined
- Respondents numbered if multiple
- "RESPONDENT(S)" right-aligned bold

SIGNATURE BLOCK:
- "P E T I T I O N E R" spaced right (Sessions style) or "PETITIONER" right
- "Through:-" then advocate name, "Advocate High Court", "C.C. No. ________"
- "Dated: ________________"

CERTIFICATE:
- "CERTIFICATE:-" bold
- "As per instructions of my client, this is the 1st [type] on the subject matter before this Hon'ble Court."
- "Counsel" centered below`;

const TOOL_PROMPTS = {
  argument: `Generate WRITTEN SUBMISSIONS / LEGAL ARGUMENTS. NOT a petition — written argument submitted during hearing.
STRUCTURE: Court header, Case reference, Parties (ONLY user-provided), "WRITTEN SUBMISSIONS ON BEHALF OF THE [PARTY]" bold underlined centered, "Respectfully Sheweth:-", Para 1: matter pending adjudication, Para 2-4: detailed facts, Para 5-6: legal analysis with statutes, "G R O U N D S" centered — lettered grounds (a-h minimum) each citing specific law with 2-3 sentences, "P R A Y E R", Signature block.`,

  petition: `Generate a COMPLETE COURT PETITION FILING PACKAGE with companion sections separated by <hr class="doc-page-break">.
PAGE 1 — MAIN PETITION with court header, parties, subject, sheweth, 10+ numbered paragraphs, GROUNDS (a-j), PRAYER, signature, certificate.
PAGE 2 — AFFIDAVIT with verification.
PAGE 3 — DISPENSATION APPLICATION.
PAGE 4 — INDEX table.`,

  writ: `Generate a COMPLETE WRIT PETITION FILING PACKAGE with ALL sections separated by <hr class="doc-page-break">.
PAGE 1 — URGENCY APPLICATION to Deputy Registrar.
PAGE 2 — MAIN WRIT PETITION under Article 199.
PAGE 3 — AFFIDAVIT with verification.
PAGE 4 — DISPENSATION APPLICATION.
PAGE 5 — INDEX table.`,

  bail: `Generate a COMPLETE BAIL APPLICATION FILING PACKAGE. All sections separated by <hr class="doc-page-break">.
PAGE 1 — MAIN BAIL PETITION with FIR table, facts, 10-14 relevant grounds, prayer.
PAGE 2 — AFFIDAVIT with verification.
PAGE 3 — DISPENSATION APPLICATION u/s 561-A CrPC.
PAGE 4 — INDEX table.`,

  plaint: `Generate a COMPLETE PLAINT / CIVIL SUIT under Order VII CPC.
Court header, parties, subject, numbered paragraphs including cause of action, limitation, jurisdiction, valuation. Prayer. Verification.`,

  appeal: `Generate a COMPLETE APPEAL / REVISION PETITION with companion affidavit.
Court header, parties, MEMORANDUM OF APPEAL, facts, grounds (a-j), prayer, certificate. Then AFFIDAVIT.`,

  'legal-notice': `Generate a FORMAL LEGAL NOTICE as a LETTER — NOT a court document. No court header.
Advocate letterhead, LEGAL NOTICE heading, addressee, numbered paragraphs, demand with deadline, consequences, signature.`,

  affidavit: `Generate a SWORN AFFIDAVIT in exact Pakistani format.
Court header if for court. Deponent details. Numbered sworn paragraphs. Verification.`,

  complaint: `Generate a COMPLETE CRIMINAL COMPLAINT FILING PACKAGE. All 4 sections separated by <hr class="doc-page-break">.
PAGE 1 — COMPLAINT u/s 200 or 156(3) CrPC with facts and prayer.
PAGE 2 — AFFIDAVIT. PAGE 3 — DISPENSATION. PAGE 4 — INDEX.`,

  'legal-opinion': `Generate a PROFESSIONAL LEGAL OPINION in Pakistani advocate format.
Letter style with advocate letterhead, addressee, property/matter sections, "MY OPINION" section, signature.
CRITICAL: Use ALL details from uploaded documents.`,

  agreement: `Generate LEGAL AGREEMENT under Contract Act 1872.
Title, parties with CNIC, WHEREAS recitals, numbered clauses (12-15), signatures, witnesses.`,

  deed: `Generate SALE/TRANSFER DEED in real Pakistani registered deed format.
Title, parties with CNIC, WHEREAS, deed clauses (1-10), schedule of property, boundaries, signatures, witnesses.`,

  poa: `Generate POWER OF ATTORNEY / WAKAALAT NAMA in exact real format.
Title, appointing clause, numbered powers (1-6), signatures.`,

  application: `Generate FORMAL APPLICATION. Detect type from user input.
FOR COURT: header, case title, application heading, sheweth, facts, prayer, signature.
FOR GOVERNMENT: addressee, subject, body, signature.`,

  mou: `Generate MOU in Pakistani commercial format.
Title, parties, WHEREAS recitals, numbered articles (1-10+), signatures, witnesses.`
};

function buildUserPrompt(tool, fields, lang, toolTitle) {
  const fieldEntries = Object.entries(fields)
    .filter(([k, v]) => v && v.trim() && k !== 'uploadedDocContent')
    .map(([k, v]) => `${k}: ${v.trim()}`)
    .join('\n');

  let langNote = lang === 'ur'
    ? `LANGUAGE: Urdu (Nastaleeq script, right-to-left). Use "درخواست گزار" for petitioner, "مسئول علیہ" for respondent, "بنام" for versus, "باادب عرض ہے کہ:" for Sheweth. Numbers in English, text in Urdu.`
    : 'LANGUAGE: Formal Pakistani legal English.';

  let docSection = '';
  if (fields.uploadedDocContent) {
    docSection = `\n\nUPLOADED DOCUMENT CONTENT (use this as primary source of facts — extract all names, dates, numbers, details from this):\n---\n${fields.uploadedDocContent.substring(0, 8000)}\n---`;
  }

  return `Generate a ${toolTitle} with these details:\n\n${langNote}\n\nUSER DETAILS:\n${fieldEntries}${docSection}\n\nREMEMBER: ONLY use facts/names/parties the user provided above. Generate complete document HTML now.`;
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'API key not configured.' }), { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  }

  try {
    const body = await req.json();
    const { tool, fields, lang, toolTitle, attachedFiles, mode } = body;
    if (!tool || !fields) return new Response(JSON.stringify({ error: 'Missing tool or fields' }), { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });

    // ── EXTRACT MODE ──
    if (mode === 'extract') {
      if (!attachedFiles || !attachedFiles.length) {
        return new Response(JSON.stringify({ error: 'No files provided' }), { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
      }
      const file = attachedFiles[0];
      if (!file.data || file.data.length < 100) {
        return new Response(JSON.stringify({ error: 'File data is empty or corrupted. Re-upload the file.' }), { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
      }

      const msgContent = [];
      const isImage = /^image\//i.test(file.type);
      const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

      if (isImage) {
        msgContent.push({ type: 'image', source: { type: 'base64', media_type: file.type, data: file.data } });
      } else if (isPDF) {
        msgContent.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: file.data } });
      } else {
        return new Response(JSON.stringify({ error: 'Only PDF and image files supported' }), { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
      }

      msgContent.push({ type: 'text', text: `You are extracting information from a legal document to fill a form for: "${toolTitle || tool}".\n\nExtract all relevant information and return ONLY a JSON object with these field IDs as keys:\n\n${fields.fieldSchema}\n\nAlso include "__docText__" with a plain-text summary (max 3000 chars) of the full document.\n\nReturn ONLY valid JSON, no explanation, no markdown fences. If a field cannot be determined, use "".` });

      const extractRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 4000, messages: [{ role: 'user', content: msgContent }] })
      });

      if (!extractRes.ok) {
        const errBody = await extractRes.text().catch(() => '');
        let userMsg = 'Extraction failed (status ' + extractRes.status + ')';
        try { const ej = JSON.parse(errBody); if (ej.error?.message) userMsg = ej.error.message; } catch(_) {}
        return new Response(JSON.stringify({ error: userMsg }), { status: extractRes.status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
      }

      const extractData = await extractRes.json();
      const rawText = extractData.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
      const clean = rawText.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
      try {
        const parsed = JSON.parse(clean);
        return new Response(JSON.stringify({ extracted: parsed, usage: extractData.usage }), { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ extracted: {}, raw: rawText }), { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
      }
    }

    // ── GENERATE / REFINE MODE ──
    let systemPromptFull, userPrompt;

    if (tool === '__refine__') {
      systemPromptFull = SYSTEM_PROMPT + '\n\nREFINEMENT MODE: Refine existing document per lawyer instruction. Output COMPLETE refined HTML. ONLY change what lawyer asked. Preserve all CSS classes and companion sections.';
      userPrompt = `Current document:\n${fields.currentDoc}\n\n${fields.targetDesc}\n\nLAWYER INSTRUCTION: ${fields.instruction}\n\nOutput complete refined document HTML. Only change what was asked.`;
    } else {
      const toolPrompt = TOOL_PROMPTS[tool] || TOOL_PROMPTS['application'];
      systemPromptFull = SYSTEM_PROMPT + '\n\nDOCUMENT TYPE INSTRUCTIONS:\n' + toolPrompt;
      userPrompt = buildUserPrompt(tool, fields, lang, toolTitle || tool);
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 8000, system: systemPromptFull, messages: [{ role: 'user', content: userPrompt }] })
    });

    if (!response.ok) {
      const errBody = await response.text();
      return new Response(JSON.stringify({ error: `API error (${response.status})`, details: errBody }), { status: response.status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    const data = await response.json();
    const html = data.content.filter(b => b.type === 'text').map(b => b.text).join('');
    const cleanHtml = html.replace(/^```html?\s*/i, '').replace(/```\s*$/i, '').trim();

    return new Response(JSON.stringify({ html: cleanHtml, usage: data.usage, model: data.model }), { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server error: ' + error.message }), { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  }
}
