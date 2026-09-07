// Bijoy (SutonnyMJ ASCII) -> Bangla Unicode.
//
// Glyph table and re-ordering rules follow Abdullah Ibne Alam's mapping, by way of
// bahar/BijoyToUnicode (AGPL-3.0). Three slots were corrected against real SutonnyMJ
// workbooks, where the published table produced wrong output:
//   0xF8  was স্ন  -> ্ল   ("Djøvn" is উল্লাহ, not উলস্না)
//   0xE6  was ম্ন  -> ু    ("bRiæj" is নজরুল, not নজরম্নল)
//   ড়/ঢ়/য় are emitted precomposed (U+09DC/09DD/09DF) rather than as
//   consonant + nukta, so vowel re-ordering treats them as single letters.

const PRE: [RegExp, string][] = [
  [/ +/g, ' '],
  [/yy/g, 'y'],
  [/vv/g, 'v'],
  [/­­/g, '­'],
  [/y&/g, 'y'],
  [/„&/g, '„'],
  [/‡u/g, 'u‡'],
  [/wu/g, 'uw'],
  [/ ,/g, ','],
  [/ \|/g, '|'],
  [/\\ /g, ''],
  [/ \\/g, ''],
  [/\\/g, ''],
  [/\n +/g, '\n'],
  [/ +\n/g, '\n'],
  [/\n{3,}/g, '\n\n'],
];

const MAP: [string, string][] = [
  ['Av','আ'],['A','অ'],['B','ই'],['C','ঈ'],['D','উ'],['E','ঊ'],['F','ঋ'],['G','এ'],['H','ঐ'],['I','ও'],['J','ঔ'],
  ['K','ক'],['L','খ'],['M','গ'],['N','ঘ'],['O','ঙ'],['P','চ'],['Q','ছ'],['R','জ'],['S','ঝ'],['T','ঞ'],
  ['U','ট'],['V','ঠ'],['W','ড'],['X','ঢ'],['Y','ণ'],['Z','ত'],['_','থ'],['`','দ'],['a','ধ'],['b','ন'],
  ['c','প'],['d','ফ'],['e','ব'],['f','ভ'],['g','ম'],['h','য'],['i','র'],['j','ল'],['k','শ'],['l','ষ'],
  ['m','স'],['n','হ'],['o','ড়'],['p','ঢ়'],['q','য়'],['r','ৎ'],['s','ং'],['t','ঃ'],['u','ঁ'],
  ['0','০'],['1','১'],['2','২'],['3','৩'],['4','৪'],['5','৫'],['6','৬'],['7','৭'],['8','৮'],['9','৯'],
  ['•','ঙ্'],
  ['v','া'],['w','ি'],['x','ী'],['y','ু'],['z','ু'],['“','ু'],['–','ু'],
  ['~','ূ'],['ƒ','ূ'],['‚','ূ'],
  ['„„','ৃ'],['„','ৃ'],['…','ৃ'],
  ['†','ে'],['‡','ে'],['ˆ','ৈ'],['‰','ৈ'],['Š','ৗ'],
  ['|','।'],['&','্‌'],
  ['^','্ব'],['‘','্তু'],['’','্থ'],['‹','্ক'],['Œ','্ক্র'],['”','চ্'],
  ['—','্ত'],['˜','দ্'],['™','দ্'],['š','ন্'],['›','ন্'],['œ','্ন'],
  ['Ÿ','্ব'],['¡','্ব'],['¢','্ভ'],['£','্ভ্র'],['¤','ম্'],['¥','্ম'],
  ['¦','্ব'],['§','্ম'],['¨','্য'],['©','র্'],['ª','্র'],['«','্র'],
  ['¬','্ল'],['­','্ল'],['®','ষ্'],['¯','স্'],
  ['°','ক্ক'],['±','ক্ট'],['²','ক্ষ্ণ'],['³','ক্ত'],['´','ক্ম'],['µ','ক্র'],
  ['¶','ক্ষ'],['·','ক্স'],['¸','গু'],['¹','জ্ঞ'],['º','গ্দ'],['»','গ্ধ'],
  ['¼','ঙ্ক'],['½','ঙ্গ'],['¾','জ্জ'],['¿','্ত্র'],
  ['À','জ্ঝ'],['Á','জ্ঞ'],['Â','ঞ্চ'],['Ã','ঞ্ছ'],['Ä','ঞ্জ'],['Å','ঞ্ঝ'],
  ['Æ','ট্ট'],['Ç','ড্ড'],['È','ণ্ট'],['É','ণ্ঠ'],['Ê','ণ্ড'],['Ë','ত্ত'],
  ['Ì','ত্থ'],['Í','ত্ম'],['Î','ত্র'],['Ï','দ্দ'],
  ['Ð','-'],['Ñ','-'],['Ò','"'],['Ó','"'],['Ô',"'"],['Õ',"'"],
  ['Ö','্র'],['×','দ্ধ'],['Ø','দ্ব'],['Ù','দ্ম'],['Ú','ন্ঠ'],['Û','ন্ড'],
  ['Ü','ন্ধ'],['Ý','ন্স'],['Þ','প্ট'],['ß','প্ত'],
  ['à','প্প'],['á','প্স'],['â','ব্জ'],['ã','ব্দ'],['ä','ব্ধ'],['å','ভ্র'],
  ['æ','ু'],['ç','ম্ফ'],['è','্ন'],['é','ল্ক'],['ê','ল্গ'],['ë','ল্ট'],
  ['ì','ল্ড'],['í','ল্প'],['î','ল্ফ'],['ï','শু'],
  ['ð','শ্চ'],['ñ','শ্ছ'],['ò','ষ্ণ'],['ó','ষ্ট'],['ô','ষ্ঠ'],['õ','ষ্ফ'],
  ['ö','স্খ'],['÷','স্ট'],['ø','্ল'],['ù','স্ফ'],['ú','্প'],['û','হু'],
  ['ü','হৃ'],['ý','হ্ন'],['þ','হ্ম'],
];

const POST: [string, string][] = [
  ['০ঃ','০:'],['১ঃ','১:'],['২ঃ','২:'],['৩ঃ','৩:'],['৪ঃ','৪:'],['৫ঃ','৫:'],
  ['৬ঃ','৬:'],['৭ঃ','৭:'],['৮ঃ','৮:'],['৯ঃ','৯:'],
  [' ঃ',' :'],['\nঃ','\n:'],[']ঃ',']:'],['[ঃ','[:'],
  ['  ',' '],['অা','আ'],['্‌্‌','্‌'],
];

const HALANT = '\u09CD';
const RA = '\u09B0';
const PRE_KARS = new Set(['\u09BF', '\u09C8', '\u09C7']);
const POST_KARS = new Set(['\u09BE', '\u09CB', '\u09CC', '\u09D7', '\u09C1', '\u09C2', '\u09C0', '\u09C3']);
const BANJON = new Set([...'\u0995\u0996\u0997\u0998\u0999\u099A\u099B\u099C\u099D\u099E\u099F\u09A0\u09A1\u09A2\u09A3\u09A4\u09A5\u09A6\u09A7\u09A8\u09AA\u09AB\u09AC\u09AD\u09AE\u09AF\u09B0\u09B2\u09B6\u09B7\u09B8\u09B9\u09DC\u09DD\u09DF\u09CE\u0982\u0983\u0981']);

const isPreKar = (c: string) => PRE_KARS.has(c);
const isPostKar = (c: string) => POST_KARS.has(c);
const isKar = (c: string) => isPreKar(c) || isPostKar(c);
const isBanjon = (c: string) => BANJON.has(c);
const isNukta = (c: string) => c === '\u0981';
const isHalant = (c: string) => c === HALANT;
const isSpace = (c: string) => c === ' ' || c === '\t' || c === '\n' || c === '\r';

function replaceAll(s: string, pairs: [string, string][]): string {
  for (const [k, v] of pairs) s = s.split(k).join(v);
  return s;
}

/** Pull a reph (র্) backwards over the consonant cluster it belongs to. */
function moveReph(str: string, i: number): string {
  let j = 1;
  for (;;) {
    if (i - j < 0) break;
    if (isBanjon(str[i - j]) && isHalant(str[i - j - 1])) j += 2;
    else if (j === 1 && isKar(str[i - j])) j += 1;
    else break;
  }
  return str.slice(0, i - j) + str[i] + str[i + 1] + str.slice(i - j, i) + str.slice(i + 2);
}

/**
 * Bijoy stores glyphs in visual order; Unicode wants logical order. This moves
 * reph and the pre-kars (ি ে ৈ) to where Unicode expects them, and joins
 * ে + া into ো and ে + ৗ into ৌ.
 */
function reorder(input: string): string {
  let str = input;

  for (let i = 0; i < str.length; i++) {
    if (i < str.length - 1 && str[i] === RA && isHalant(str[i + 1]) && !isHalant(str[i - 1])) {
      str = moveReph(str, i);
      i += 1;
    }
  }

  str = str.split(HALANT + HALANT).join(HALANT);

  for (let i = 0; i < str.length; i++) {
    if (
      i < str.length - 1 && str[i] === RA && isHalant(str[i + 1]) &&
      !isHalant(str[i - 1]) && isHalant(str[i + 2])
    ) {
      str = moveReph(str, i);
      i += 1;
      continue;
    }

    // kar + halant + consonant  ->  halant + consonant + kar
    if (i > 0 && i < str.length - 1 && str[i] === HALANT && (isKar(str[i - 1]) || isNukta(str[i - 1]))) {
      str = str.slice(0, i - 1) + str[i] + str[i + 1] + str[i - 1] + str.slice(i + 2);
    }

    // র + halant + kar  ->  kar + র + halant
    if (
      i > 0 && i < str.length - 1 && str[i] === HALANT &&
      str[i - 1] === RA && str[i - 2] !== HALANT && isKar(str[i + 1])
    ) {
      str = str.slice(0, i - 1) + str[i + 1] + str[i - 1] + str[i] + str.slice(i + 2);
    }

    // pre-kar hops over the following consonant cluster
    if (i < str.length - 1 && isPreKar(str[i]) && !isSpace(str[i + 1])) {
      let out = str.slice(0, i);
      let j = 1;
      while (i + j < str.length - 1 && isBanjon(str[i + j])) {
        if (isHalant(str[i + j + 1])) j += 2;
        else break;
      }
      out += str.slice(i + 1, i + j + 1);

      let skip = 0;
      if (str[i] === '\u09C7' && str[i + j + 1] === '\u09BE') { out += '\u09CB'; skip = 1; }
      else if (str[i] === '\u09C7' && str[i + j + 1] === '\u09D7') { out += '\u09CC'; skip = 1; }
      else out += str[i];

      out += str.slice(i + j + skip + 1);
      str = out;
      i += j;
    }

    // chandrabindu sits after the vowel sign
    if (i < str.length - 1 && isNukta(str[i]) && isPostKar(str[i + 1])) {
      str = str.slice(0, i) + str[i + 1] + str[i] + str.slice(i + 2);
    }
  }

  return str;
}

/** Convert one Bijoy/SutonnyMJ string to Bangla Unicode. Non-Bangla text passes through mangled, so gate calls with `classify`. */
export function bijoyToUnicode(input: string): string {
  if (!input) return input;
  let t = input;
  for (const [re, v] of PRE) t = t.replace(re, v);
  t = replaceAll(t, MAP);
  t = reorder(t);
  t = replaceAll(t, POST);
  return t;
}
