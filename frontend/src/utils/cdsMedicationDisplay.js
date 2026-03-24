/**
 * CDS medication display helpers — parse long Drools strings into clearer UI
 * (OR alternatives, class expansions, FDC availability prompts).
 * Pure functions; safe if imports fail in tests.
 */

/**
 * @typedef {{ title: string, examples: string[] }} ClassExpansion
 */

/**
 * @typedef {{ type: 'line' | 'note' | 'choose_one', text?: string, label?: string, options?: string[] }} DisplayItem
 */

/**
 * Guideline-aligned examples (Rwanda STG–style generics; clinician picks per formulary).
 * @param {string} text
 * @returns {ClassExpansion[]}
 */
export function getClassExpansions(text) {
  if (!text || typeof text !== 'string') return [];
  const out = [];

  if (/\bacei\b|ace[\s-]*inhibitor/i.test(text)) {
    out.push({
      title: 'ACE inhibitor — specific options (per national guideline / formulary)',
      examples: ['Enalapril', 'Lisinopril', 'Captopril', 'Ramipril', 'Perindopril'],
    });
  }
  if (/\barb\b|angiotensin\s*(ii\s*)?receptor|angiotensin\s+receptor\s+blocker/i.test(text)) {
    out.push({
      title: 'ARB — specific options',
      examples: ['Losartan', 'Telmisartan', 'Candesartan', 'Valsartan', 'Olmesartan'],
    });
  }
  if (/\bccb\b|calcium\s*channel/i.test(text)) {
    out.push({
      title: 'Calcium channel blocker — examples',
      examples: ['Amlodipine', 'Nifedipine (e.g. LA)', 'Felodipine'],
    });
  }
  if (/\bdpp-?4\s*i|dpp4|gliptin/i.test(text)) {
    out.push({
      title: 'DPP-4 inhibitor — examples',
      examples: ['Vildagliptin', 'Sitagliptin', 'Linagliptin'],
    });
  }
  if (/\bsglt2|flozin|gliflozin/i.test(text)) {
    out.push({
      title: 'SGLT2 inhibitor — examples',
      examples: ['Dapagliflozin', 'Empagliflozin'],
    });
  }
  if (/\bsulfonylurea|\bsu\b|gliclazide|glimepiride|glibenclamide/i.test(text)) {
    out.push({
      title: 'Sulfonylurea — examples',
      examples: ['Gliclazide', 'Glimepiride', 'Glibenclamide (use per local protocol)'],
    });
  }
  if (/\bthiazide|hctz|hydrochlorothiazide|chlorthalidone|indapamide/i.test(text)) {
    out.push({
      title: 'Thiazide / thiazide-like diuretic — examples',
      examples: ['Hydrochlorothiazide', 'Chlorthalidone', 'Indapamide'],
    });
  }
  if (/\bbeta[\s-]*blocker|\bbeta\s*blocker/i.test(text)) {
    out.push({
      title: 'Beta-blocker — examples',
      examples: ['Bisoprolol', 'Atenolol', 'Metoprolol', 'Carvedilol'],
    });
  }
  return out;
}

/**
 * Fixed-dose / single-pill combinations often need local availability check.
 * @param {string} text
 */
export function shouldPromptFdcAvailability(text) {
  if (!text || typeof text !== 'string') return false;
  // Common FDC wording in guidelines + strength/strength and drug/drug combos
  return (
    /\b(single\s+pill|fixed[\s-]dose|fdc|combination\s+(tablet|capsule|pill))\b/i.test(text) ||
    /\d+\s*mg\s*\/\s*\d+\s*mg/i.test(text) ||
    /\/\s*(amlodipine|perindopril|losartan|hydrochlorothiazide|enalapril|atenolol|indapamide)/i.test(
      text
    )
  );
}

/**
 * Split a raw medication line into UI items (notes + choose-one groups + plain lines).
 * @param {string} raw
 * @returns {{ items: DisplayItem[], fdcPrompt: boolean, classExpansions: ClassExpansion[], original: string }}
 */
export function parseMedicationForDisplay(raw) {
  const original = String(raw || '').trim();
  if (!original) {
    return { items: [], fdcPrompt: false, classExpansions: [], original: '' };
  }

  const fdcPrompt = shouldPromptFdcAvailability(original);
  const classExpansions = getClassExpansions(original);

  const oneOfRe = /add\s+ONE\s+of\s*(?:\([^)]*\))?\s*:?\s*/i;
  if (oneOfRe.test(original)) {
    const match = original.match(oneOfRe);
    const start = match ? match.index + match[0].length : 0;
    const preamble = original.slice(0, match ? match.index : 0).trim();
    const rest = original.slice(start).trim();
    const opts = rest
      .split(/\s+OR\s+/i)
      .map((s) => s.replace(/^[,;]\s*/, '').trim())
      .filter(Boolean);

    const items = [];
    if (preamble) items.push({ type: 'note', text: preamble });
    if (opts.length >= 2) {
      items.push({
        type: 'choose_one',
        label: 'Choose one option (guideline alternative):',
        options: opts,
      });
    } else if (opts.length === 1) {
      items.push({ type: 'line', text: opts[0] });
    }
    return { items: items.length ? items : [{ type: 'line', text: original }], fdcPrompt, classExpansions, original };
  }

  const orSegments = original
    .split(/\s+OR\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);

  if (orSegments.length >= 2) {
    return {
      items: [
        {
          type: 'choose_one',
          label: 'Alternatives — pick one line that matches what you will prescribe:',
          options: orSegments,
        },
      ],
      fdcPrompt,
      classExpansions,
      original,
    };
  }

  return {
    items: [{ type: 'line', text: original }],
    fdcPrompt,
    classExpansions,
    original,
  };
}

/**
 * Stable selection key for prescription checkbox state.
 * @param {string} recId
 * @param {number} decisionIndex
 * @param {number} lineIndex
 */
export function medSelectionKey(recId, decisionIndex, lineIndex) {
  const r = recId || 'rec';
  return `${r}|d${decisionIndex}|l${lineIndex}`;
}

/**
 * Normalize legacy keys from older UI `${recId}:${idx}` → `${recId}|d0|l${idx}`
 * @param {string} key
 */
export function migrateLegacyMedKey(key) {
  if (!key || typeof key !== 'string') return key;
  if (key.includes('|d')) return key;
  const parts = key.split(':');
  if (parts.length === 2) return `${parts[0]}|d0|l${parts[1]}`;
  return key;
}
