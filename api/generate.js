// Vercel Serverless Function — Wakeel AI Document Generation
// Calls Claude Sonnet 4.5 — formatting learned from real filed Pakistani court documents

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `You are Wakeel AI, an expert Pakistani legal document drafting assistant. You generate court-ready legal documents that follow the EXACT formatting Pakistani courts accept.

ABSOLUTE RULES — NEVER VIOLATE:
1. Output ONLY HTML content using the CSS classes listed below. No markdown. No code fences. No explanation text before or after.
2. NEVER add parties, respondents, names, CNIC numbers, addresses, FIR numbers, dates, or ANY factual information the user did not provide. Use ONLY what the user gives you. If user named 1 respondent, use only 1 respondent. Do NOT invent "Federation of Pakistan", "IGP Punjab" or any other party.
3. NEVER invent case law. Only cite well-known, real Pakistani case law you are confident exists. If unsure, use "as held by the superior courts of Pakistan" without fabricating a citation.
4. Use proper Pakistani legal language — formal English, "Hon'ble Court", "Respectfully Sheweth", etc.
5. Cite REAL Pakistani statutes: PPC 1860, CrPC 1898, CPC 1908, QSO 1984, Constitution 1973, MFLO 1961, Transfer of Property Act 1882, Contract Act 1872, etc.
6. Leave date blanks as "___day of ________ [year]" unless user provides specific dates.

REQUIRED CSS CLASSES:
- doc-court-header > doc-court-name, doc-pet-no — court heading
- doc-parties > doc-party-row > doc-party-name + doc-party-role, doc-versus — parties
- doc-subject — subject/title line
- doc-sheweth — "Respectfully Sheweth:-"
- doc-para > doc-para-n + div — numbered paragraphs
- doc-section-head — section headings like "G R O U N D S"
- doc-prayer-head, doc-prayer-intro, doc-prayer-item — prayer section
- doc-certificate > doc-cert-head — certificate
- doc-index > doc-index-title + table — index table
- doc-sig-block > doc-sig-line, doc-sig-name, doc-sig-role — signature
- ri > ri-n — lettered items (a, b, c)

FORMATTING FROM REAL FILED DOCUMENTS:

COURT HEADER:
- Sessions/District: "BEFORE THE COURT OF LEARNED SESSIONS JUDGE, [CITY]"
- High Court: "IN THE LAHORE HIGH COURT [BENCH] [CITY]" (bold, underlined, centered)
- Special Court: "BEFORE THE COURT OF LEARNED SESSIONS JUDGE/ JUDGE SPECIAL COURT [TYPE], [CITY]"

PARTIES:
- Petitioner full details (name s/o father, address, CNIC if given)
- "PETITIONER" on next line, right-aligned
- "VERSUS" centered bold
- Respondent(s) numbered if multiple
- "RESPONDENT(S)" right-aligned
- ONLY list parties user provided

FIR TABLE (bail only): HTML table with borders — FIR No, Dated, U/s, P/S, District

GROUNDS: "G R O U N D S" spaced centered. Each ground lettered a, b, c, d...

PRAYER: "PRAYER:" bold. Then "Under the above circumstances..."

SIGNATURE: "P E T I T I O N E R" right. "THROUGH:" then advocate name, "Advocate High Court", C.C. No.

CERTIFICATE: "CERTIFICATE:-" bold. "As per instructions of my client it is 1st [type] on the subject matter before this Hon'ble Court."`;

const TOOL_PROMPTS = {
  argument: "Generate WRITTEN SUBMISSIONS. Structure: Court header, Parties (ONLY user-provided), Subject, Respectfully Sheweth, Numbered paras for facts/evidence, G R O U N D S with lettered grounds (a,b,c) each citing specific law sections, PRAYER, Signature (PETITIONER + THROUGH: Advocate).",

  petition: "Generate a COURT PETITION. Structure: Court header (centered bold), Petition No.___/year, Petitioner details then PETITIONER right, VERSUS centered, Respondent then RESPONDENT(S) right, Subject underlined, separator dots, Respectfully Sheweth:- underlined, Numbered 'That...' paragraphs, G R O U N D S with lettered grounds, PRAYER, P E T I T I O N E R right, THROUGH: Advocate, CERTIFICATE.",

  writ: "Generate WRIT PETITION per real Lahore High Court format: 'IN THE [HIGH COURT] [BENCH] [CITY]' bold underlined centered. W.P.No.___/year centered. Petitioner details then '………… (Petitioner)' right bold. VERSUS bold underlined centered. Respondent(s) ONLY as user provided then '………..RESPONDENT(S)' right bold. Subject: 'PETITION UNDER ARTICLE 199...' underlined justified. Dot separator centered. 'Respectfully Sheweth:-' underlined. 'That...' paragraphs justified. PRAYER bold underlined. 'HUMBLE PETITIONER' right. 'THROUGH:-' then advocate right. CERTIFICATE. Then SEPARATE AFFIDAVIT section: same header, 'Affidavit of:- [name]' bold underlined, 'I the above named deponent do hereby solemnly affirm and declare on oath as under:', sworn paragraphs, '…Deponent' right, 'VERIFICATION:-', verified text, '……Deponent' right.",

  bail: "Generate BAIL APPLICATION per real format. FOR SESSIONS COURT: 'BEFORE THE COURT OF LEARNED SESSIONS JUDGE, [CITY]' centered. Petitioner s/o father address then PETITIONER. VERSUS. '1. The State.' plus user's respondent then RESPONDENTS. 'PETITION UNDER SECTION 497/498 Cr.P.C. FOR THE GRANT OF [BAIL TYPE]' bold underlined. FIR TABLE with borders (FIR No, Dated, U/s, P/S, District). 'Respectfully Sheweth,' Para 1: 'That the brief facts giving rise to the instant petition are that...' Para 2: 'That the petitioner seeks bail inter alia on the following:-' G R O U N D S with many lettered grounds (a through t): innocence, false implication, malafide, delay in FIR, no witnesses, no forensic, no recovery, nothing to connect, investigation complete, no flight risk, ready to furnish bail bonds. PRAYER: 'Under the above circumstances...post-arrest bail may kindly be granted...' P E T I T I O N E R spaced right. THROUGH: Advocate. CERTIFICATE: 'As per instructions of my client it is 1st post-arrest bail...'",

  plaint: "Generate PLAINT / CIVIL SUIT under Order VII CPC. Court header, Suit No.___/year, Plaintiff vs Defendant, Subject, Sections: JURISDICTION, FACTS (detailed numbered paras), CAUSE OF ACTION, LIMITATION, Valuation/court fee, PRAYER with specific reliefs, VERIFICATION, Signature.",

  appeal: "Generate APPEAL/REVISION. Appellate court header, Appeal No.___/year, 'IN' original case reference, Appellant vs Respondent, Reference to impugned judgment, 'MEMORANDUM OF APPEAL'/'GROUNDS OF APPEAL' with lettered grounds challenging specific findings, PRAYER, Signature.",

  'legal-notice': "Generate LEGAL NOTICE as a LETTER (NOT court document). 'LEGAL NOTICE' centered heading, Ref No, Date blank, Through: Registered Post A.D., From: Client through Advocate, To: Recipient, Subject, 'Under instructions of my client...', Paragraphs with grievance/dates/amounts, Legal provisions, Demand with deadline, 'Failing which legal proceedings...', 'Without prejudice...', Advocate signature. NO court header. NO parties block. NO Respectfully Sheweth.",

  affidavit: "Generate SWORN AFFIDAVIT. Court header if for court or just 'AFFIDAVIT' heading. 'Affidavit of:- [name details]' bold underlined. 'I, the above named deponent, do hereby solemnly affirm and declare on oath as under:' Numbered 'That...' paragraphs. Last para: 'That the contents are true and correct...nothing kept concealed.' '…Deponent' right. 'VERIFICATION:-' 'Verified on oath at [city] this ___day of...' '……Deponent' right.",

  agreement: "Generate AGREEMENT under Contract Act 1872. Title centered bold. 'This Agreement is made at [city], this ___ day of _____ [year];' 'BETWEEN;' Party 1 with s/o CNIC address '(hereinafter THE FIRST PARTY)'. 'AND' bold. Party 2 '(hereinafter THE SECOND PARTY)'. WHEREAS recitals. 'NOW THIS AGREEMENT WITNESSETH:' Numbered clauses (10-15). 'IN WITNESS WHEREOF...' Signature blocks. 'WITNESSES' with 2 witness blanks (name, address, CNIC).",

  deed: "Generate SALE/TRANSFER DEED per real format. Title with amount if applicable. 'This Deed is made at [city], this ___ day of _____ [year];' 'BETWEEN;' parties with full CNIC '(hereinafter THE VENDOR/MORTGAGOR)'. 'AND' bold. Other party. Multiple WHEREAS clauses for title chain. 'NOW THIS DEED WITNESSETH:' underlined. Numbered clauses. 'SCHEDULE' bold underlined with property description and bounds: a) North b) South c) East d) West. 'IN WITNESS WHEREOF...' Signatures with CNIC. 'WITNESSES' section.",

  poa: "Generate POWER OF ATTORNEY / WAKAALAT NAMA per real format. 'POWER OF ATTORNEY' bold underlined centered. Court name bold underlined if for litigation. Case title. 'IN THE MATTER OF:- [case]' underlined. 'Know I/we all to whom these present shall come, that I/We the undersigned appoint [Advocate] Advocate High Court C.C.No.[X] To be the advocate ON BEHALF OF [role] to do all the following acts, deeds and things:-' Numbered clauses 1-6: act/appear/plead, present pleadings/appeals/petitions up to Supreme Court, withdraw/compromise/arbitration, receive money/grant receipts, engage other practitioners, fee agreement. 'In witness hereof...' Client signature. 'Accepted subject to payment of full fee.' Advocate name and details.",

  application: "Generate FORMAL APPLICATION. FOR COURT: court header, case reference, 'Respectfully Sheweth,' body, prayer, signature. FOR GOVERNMENT: To/From/Subject, 'Respected Sir/Madam,' body, prayer, 'Thanking you', signature. FOR DISPENSATION: court header, case ref, 'APPLICATION UNDER SECTION 561-A Cr.P.C FOR DISPENSATION OF ANNEXURES', 'That the petitioner has filed without certified copy which is not available...', prayer, signature.",

  mou: "Generate MOU. 'MEMORANDUM OF UNDERSTANDING' centered bold. Date and place. BETWEEN parties. WHEREAS recitals. NOW THEREFORE. Numbered articles. IN WITNESS WHEREOF. Signatures. Witnesses."
};

function buildUserPrompt(tool, fields, lang, toolTitle) {
  const fieldEntries = Object.entries(fields)
    .filter(([k, v]) => v && v.trim())
    .map(([k, v]) => `${k}: ${v.trim()}`)
    .join('\n');

  let langNote = '';
  if (lang === 'ur') {
    langNote = `LANGUAGE: Urdu (Nastaleeq script, right-to-left). Court header: "بعدالت جناب [designation] صاحب [court]". Use "درخواست گزار" for petitioner, "مسئول علیہ" for respondent, "بنام" for versus, "جناب عالی!" for court address, "باادب عرض ہے کہ:" for Sheweth. Numbers in English, text in Urdu.`;
  } else {
    langNote = 'LANGUAGE: Formal Pakistani legal English.';
  }

  return `Generate a ${toolTitle} with these details:\n\n${langNote}\n\nUSER DETAILS:\n${fieldEntries}\n\nREMEMBER: ONLY use facts/names/parties the user provided above. Generate complete document HTML now.`;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API key not configured. Add ANTHROPIC_API_KEY to Vercel environment variables.' });

  try {
    const { tool, fields, lang, toolTitle } = req.body;
    if (!tool || !fields) return res.status(400).json({ error: 'Missing tool or fields' });

    let systemPromptFull, userPrompt;

    if (tool === '__refine__') {
      systemPromptFull = SYSTEM_PROMPT + '\n\nREFINEMENT MODE: Refine existing document per lawyer instruction. Output COMPLETE refined HTML. ONLY change what lawyer asked. Do NOT add parties/facts unless asked. Preserve all CSS classes.';
      userPrompt = `Current document:\n${fields.currentDoc}\n\n${fields.targetDesc}\n\nLAWYER INSTRUCTION: ${fields.instruction}\n\nOutput complete refined document HTML. Only change what was asked.`;
    } else {
      const toolPrompt = TOOL_PROMPTS[tool] || TOOL_PROMPTS['application'];
      systemPromptFull = SYSTEM_PROMPT + '\n\nDOCUMENT TYPE:\n' + toolPrompt;
      userPrompt = buildUserPrompt(tool, fields, lang, toolTitle || tool);
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-5-20250929', max_tokens: 4096, system: systemPromptFull, messages: [{ role: 'user', content: userPrompt }] })
    });

    if (!response.ok) {
      const errBody = await response.text();
      return res.status(response.status).json({ error: `API error (${response.status})`, details: errBody });
    }

    const data = await response.json();
    const html = data.content.filter(b => b.type === 'text').map(b => b.text).join('');
    const cleanHtml = html.replace(/^```html?\s*/i, '').replace(/```\s*$/i, '').trim();

    return res.status(200).json({ html: cleanHtml, usage: data.usage, model: data.model });
  } catch (error) {
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}
