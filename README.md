# Bijoy → Unicode spreadsheet converter

Converts Bangla spreadsheets written in Bijoy (SutonnyMJ and friends) to Unicode,
so the text searches, sorts and copies correctly in Excel, Google Sheets, and
anywhere else. Reads `.xlsx` and legacy `.xls`, always writes `.xlsx`.

Everything runs in the browser. Files are never uploaded.

```bash
npm run dev     # http://localhost:3000
npm run build
npm test        # conversion + detection tests
```

## Unicode and Avro are the same thing

Avro is a keyboard layout that types Unicode directly — it has no encoding of its
own. Converting Bijoy to Unicode is exactly what "converting to Avro" means, and
the output here is byte-for-byte what Avro would have produced.

## How it works

**`src/lib/bijoy.ts`** — the glyph map and re-ordering rules.

Bijoy is not an encoding, it is a font trick: Bangla glyphs are painted over ASCII
code points, so `KviLvbv` is stored as those literal Latin letters and only reads
as কারখানা on a machine with SutonnyMJ installed. Conversion is a substitution
followed by a re-ordering pass, because Bijoy stores glyphs in *visual* order
while Unicode wants *logical* order:

- the pre-kars `ি ে ৈ` are typed before their consonant and must move after it
- `ে` + `া` combine into `ো`, `ে` + `ৗ` into `ৌ`
- reph `র্` has to slide back across the consonant cluster it belongs to

The table is Abdullah Ibne Alam's mapping (via `bahar/BijoyToUnicode`, AGPL-3.0)
with three slots corrected against real workbooks, where the published values
produced wrong Bangla:

| byte | published | correct | evidence |
| --- | --- | --- | --- |
| `0xF8` | `স্ন` | `্ল` | `Djøvn` is উল্লাহ, not উলস্না |
| `0xE6` | `ম্ন` | `ু` | `bRiæj` is নজরুল, not নজরম্নল |
| — | `য` + `়` | `য়` (U+09DF) | decomposed nukta breaks vowel re-ordering: `Ry‡qj` came out জুযে়ল instead of জুয়েল |

`npm test` locks these in.

**`src/lib/detect.ts`** — deciding which cells to touch.

Bijoy text is ASCII, so a converter pointed at an English cell turns `Total` into
`ঝধঃধত`. The obvious fix is to read the cell's font and convert only the ones set
in SutonnyMJ — but legacy `.xls` does not expose fonts to any JavaScript reader,
so the decision has to come from the text itself.

Each string is scored on signals that separate mojibake from English:

- glyphs above ASCII 126 that SutonnyMJ uses for conjuncts (`Ä`, `¤`, `‡`) and
  English does not — decisive on their own. The typographic set (`© – — " "`) is
  excluded, since English uses those too.
- a capital in the middle of a word (`KviLvbv`), which English words don't do
- a word of three or more letters with no English vowel (`gvgyb`)
- letter pairs that are everywhere in Bijoy and rare in English (`Av`, `iv`, `wU`)
- against that, words from an English office-vocabulary list, weighted by how much
  of the cell they cover — so `No` alone reads as English, but `KvuP No` does not

Cells with no signal either way — room numbers like `05-301`, single words — are
resolved from the workbook as a whole: in a file that is otherwise Bangla
throughout, they are Bangla too.

Measured against 589 distinct strings pulled from five real Bijoy rent ledgers and
a control set of ordinary English spreadsheet headings, this misfiles none of
either.

**`src/lib/convert.ts`** — reading and rewriting the workbook.

`.xlsx` goes through ExcelJS, which round-trips fonts, fills, borders, merges,
column widths and number formats, so only the text changes. Converted cells get a
Unicode Bangla font stamped on them; untouched cells keep what they had.

> ExcelJS hands every cell sharing an XF record the *same* style object, so
> assigning `cell.font` restyles unrelated cells across the sheet. The code
> detaches a copy of the style first.

`.xls` goes through SheetJS, the only reader that handles BIFF8 in a browser. It
carries merged cells, column widths, row heights and number formats across, but
the 1997 format does not expose fonts, colours or borders to any browser reader —
those are lost regardless. Open the result and apply a Bangla font to get the look
back.

Formulas keep their formula; only the cached result text is rewritten. Rich text
is converted run by run, so per-run bold and italic survive.

## Options

| | |
| --- | --- |
| **Bangla cells only** | default; converts what reads as Bijoy, leaves English headings |
| **Only certain matches** | converts cells with Bijoy-only glyphs; misses short words, touches nothing else |
| **Every text cell** | converts all text, English included |
| Sheet tab names | off by default — tabs are usually already English |
| Numbers as Bangla digits | off by default; rewrites number cells as **text**, so totals stop calculating |
| Font for converted cells | Nikosh, Kalpurush, SolaimanLipi, Noto Sans Bengali, Vrinda, or keep the original |

## Licence note

The glyph map derives from `bahar/BijoyToUnicode`, which is AGPL-3.0. Bijoy,
SutonnyMJ and Avro belong to their respective owners.
