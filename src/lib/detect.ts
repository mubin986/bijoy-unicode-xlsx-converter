// Deciding which cells are Bijoy.
//
// Bijoy text is ASCII, so a converter pointed at an English cell turns "Total"
// into "ঝধঃধত". Legacy .xls files don't expose the cell font through any JS
// reader, so the decision has to come from the text itself.

export type Verdict = 'bijoy' | 'english' | 'neutral' | 'already-unicode' | 'empty';

export type Classification = {
  verdict: Verdict;
  score: number;
  reasons: string[];
};

const BANGLA_UNICODE = /[ঀ-৿]/;

/**
 * Glyph slots SutonnyMJ uses for conjuncts that effectively never appear in
 * English text. The typographic set (© ™ – — ' ' " " …) is excluded on purpose:
 * those show up in ordinary English writing too.
 */
function isBijoyOnlyGlyph(ch: string): boolean {
  const c = ch.codePointAt(0)!;
  if (c >= 0x00c0 && c <= 0x00ff) return true; // À-ÿ — conjunct ligatures
  if (c >= 0x00a1 && c <= 0x00bf) return c !== 0x00a9; // ¡-¿, keeping © out
  if (c === 0x0083 || c === 0x0088) return true;
  return [
    0x2020, 0x2021, 0x201e, 0x2039, 0x203a, 0x0152, 0x0153,
    0x0160, 0x0161, 0x0178, 0x0192, 0x02c6, 0x2030, 0x2022, 0x02dc,
  ].includes(c);
}

/** Words that make a cell read as English rather than mojibake. */
const ENGLISH_WORDS = new Set(
  `a an the and or of for to in on at by with from as is are was were be been
   total subtotal grand sum count average name names date dates day month year
   amount amounts price cost rate rates qty quantity unit units no number num sl
   sr serial id code type status remark remarks note notes comment comments
   description details item items product products category group class
   address mobile phone email contact person customer client supplier vendor
   room shop floor building block rent rents paid unpaid due dues balance
   advance security deposit received receipt payment payments bill invoice
   opening closing previous current start end till upto
   january february march april may june july august september october november december
   jan feb mar apr jun jul aug sep sept oct nov dec
   monday tuesday wednesday thursday friday saturday sunday
   taka tk bdt usd percent percentage discount vat tax net gross
   signature sign authorized prepared checked approved page sheet report summary
   yes na nil none other others misc`
    .trim()
    .split(/\s+/),
);

/** Letter pairs that are everywhere in Bijoy and rare in English. */
const BIJOY_PAIRS = [
  'Av', 'iv', 'Kv', 'gv', 'bv', 'Zv', 'jv', 'wU', 'Mv',
  'fv', 'cv', 'wg', 'wm', 'wb', 'wi', 'yj', 'yi', 'vt', 'vi',
];

export function classify(value: string): Classification {
  if (!value || !value.trim()) return { verdict: 'empty', score: 0, reasons: [] };

  if (BANGLA_UNICODE.test(value)) {
    return { verdict: 'already-unicode', score: 0, reasons: ['already Bangla Unicode'] };
  }

  if ([...value].some(isBijoyOnlyGlyph)) {
    return { verdict: 'bijoy', score: 99, reasons: ['Bijoy-only glyphs'] };
  }

  const tokens = value.split(/[^A-Za-z]+/).filter(Boolean);
  const totalLetters = tokens.join('').length;

  if (!totalLetters) {
    return {
      verdict: 'neutral',
      score: 0,
      reasons: [/\d/.test(value) ? 'digits and punctuation only' : 'no letters'],
    };
  }

  const reasons: string[] = [];
  let score = 0;
  let englishLetters = 0;
  let pairHits = 0;

  for (const token of tokens) {
    if (ENGLISH_WORDS.has(token.toLowerCase())) {
      englishLetters += token.length;
      continue;
    }
    if (/[a-z][A-Z]/.test(token)) {
      score += 3;
      reasons.push(`capital inside "${token}"`);
    }
    if (token.length >= 3 && !/[aeiouAEIOU]/.test(token)) {
      score += 2;
      reasons.push(`no English vowel in "${token}"`);
    }
    if (BIJOY_PAIRS.some((p) => token.includes(p))) pairHits += 1;
    if (/^[A-Z]?[a-z]+$/.test(token) && /[aeiou]/.test(token.toLowerCase()) && token.length >= 4) {
      score -= 1;
    }
  }

  if (pairHits) {
    score += Math.min(pairHits, 2);
    reasons.push('Bijoy letter pairs');
  }
  if (value.includes('`')) {
    score += 2;
    reasons.push('Bijoy দ glyph');
  }

  const englishShare = englishLetters / totalLetters;
  if (englishShare >= 0.6) {
    score -= 5;
    reasons.push('reads as English');
  } else if (englishShare >= 0.3) {
    score -= 2;
    reasons.push('partly English');
  }

  const verdict: Verdict = score >= 3 ? 'bijoy' : score <= -1 ? 'english' : 'neutral';
  return { verdict, score, reasons };
}

/**
 * Cells like "05-301" or "gvgyb" carry no decisive signal on their own. In a
 * workbook that is otherwise wall-to-wall Bijoy they are Bijoy too, so the
 * ambiguous ones are resolved from the company the rest of the file keeps.
 */
export function workbookLeansBijoy(bijoyCount: number, englishCount: number): boolean {
  if (bijoyCount < 5) return false;
  return bijoyCount / (bijoyCount + englishCount) >= 0.7;
}
