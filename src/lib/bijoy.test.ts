import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { bijoyToUnicode } from './bijoy';
import { classify } from './detect';

// Every pair below was taken out of a real SutonnyMJ workbook and checked by
// reading the Bangla, not by trusting the mapping table.
const GOLDEN: Array<[string, string]> = [
  ['LvRv mycvi gv‡K©U', 'খাজা সুপার মার্কেট'],
  ['c~e© AvMvbMi, †KivYxMÄ, XvKv|', 'পূর্ব আগানগর, কেরাণীগঞ্জ, ঢাকা।'],
  ['cÖwZôv‡bi bvg', 'প্রতিষ্ঠানের নাম'],
  ['KviLvbv msL¨v', 'কারখানা সংখ্যা'],
  ['wmwÏK Mv‡g©›Um', 'সিদ্দিক গার্মেন্টস'],
  ['2 UvKv e„w×', '২ টাকা বৃদ্ধি'],
  ['A‡±vei -2025', 'অক্টোবর -২০২৫'],
  ['¯^Y©v Mv‡g©›Um', 'স্বর্ণা গার্মেন্টস'],
  ['Rvnv½xi Avjg g„av', 'জাহাঙ্গীর আলম মৃধা'],
  ['wewìs I Zjv b¤^i', 'বিল্ডিং ও তলা নম্বর'],
  ['‡m‡Þ¤^i-2023', 'সেপ্টেম্বর-২০২৩'],
];

// The three slots where the published mapping table was wrong. If any of these
// regress, the glyph map has been reverted to the upstream values.
const CORRECTIONS: Array<[string, string, string]> = [
  ['wemwgjøvwni ivn&gvwbi ivwng', 'বিসমিল্লাহির রাহ্‌মানির রাহিম', '0xF8 is ্ল, not স্ন'],
  ['gvgyb †gvjøv', 'মামুন মোল্লা', '0xF8 is ্ল, not স্ন'],
  ['bRiæj', 'নজরুল', '0xE6 is ু, not ম্ন'],
  ['‡deªæqvix -2026', 'ফেব্রুয়ারী -২০২৬', '0xE6 is ু, not ম্ন'],
  ['Ry‡qj cvÄvex', 'জুয়েল পাঞ্জাবী', 'য় is precomposed, so ে re-orders past it'],
  ['d‡qR Avn‡¤§`', 'ফয়েজ আহম্মেদ', 'য় is precomposed, so ে re-orders past it'],
];

test('converts real SutonnyMJ cells', () => {
  for (const [input, expected] of GOLDEN) {
    assert.equal(bijoyToUnicode(input), expected, `for ${JSON.stringify(input)}`);
  }
});

test('keeps the corrected glyph slots', () => {
  for (const [input, expected, why] of CORRECTIONS) {
    assert.equal(bijoyToUnicode(input), expected, why);
  }
});

test('emits precomposed ড় ঢ় য়', () => {
  // Decomposed consonant + nukta would break vowel re-ordering.
  assert.equal(bijoyToUnicode('o'), 'ড়');
  assert.equal(bijoyToUnicode('p'), 'ঢ়');
  assert.equal(bijoyToUnicode('q'), 'য়');
});

test('spots Bijoy text', () => {
  for (const s of ['KviLvbv bs', 'gvwj‡Ki bvg', 'cÖwZôv‡bi bvg', 'Avãyj gÄy']) {
    assert.equal(classify(s).verdict, 'bijoy', s);
  }
});

test('leaves English headings alone', () => {
  for (const s of ['Total', 'Grand Total', 'Sl No', 'Remarks', 'January 2023', 'Unit Price']) {
    assert.notEqual(classify(s).verdict, 'bijoy', s);
  }
});

test('skips text that is already Unicode', () => {
  assert.equal(classify('কারখানা নং').verdict, 'already-unicode');
});

test('leaves cells with no signal undecided', () => {
  // Resolved later from the workbook as a whole, not from the cell.
  assert.equal(classify('05-301').verdict, 'neutral');
});
