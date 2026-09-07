# Bijoy → Unicode spreadsheet converter

Converts Bangla spreadsheets written in Bijoy (SutonnyMJ and friends) to Unicode,
so the text searches, sorts and copies correctly in Excel, Google Sheets, and
anywhere else.

Drop a file in, check the before/after table, download the result. Reads `.xlsx`
and legacy `.xls`, always writes `.xlsx`. **Everything runs in the browser — files
are never uploaded**, so it works offline once the page has loaded.

```
KviLvbv bs      →  কারখানা নং
cÖwZôv‡bi bvg   →  প্রতিষ্ঠানের নাম
gvgyb †gvjøv    →  মামুন মোল্লা
```

## Why this is not a find-and-replace

Bijoy is not an encoding, it is a font trick. Bangla glyphs are painted over ASCII
code points, so কারখানা is stored as the literal Latin letters `KviLvbv` and only
reads correctly on a machine with SutonnyMJ installed. Two things make conversion
harder than substituting a table:

**Bijoy stores glyphs in visual order, Unicode wants logical order.** So the
converter also has to re-order:

- the pre-kars `ি ে ৈ` are typed *before* their consonant and must move after it
- `ে` + `া` combine into `ো`, `ে` + `ৗ` into `ৌ`
- reph `র্` has to slide back across the consonant cluster it belongs to

**The source text is ASCII, so a blind conversion destroys English cells.** Run a
converter over a column header and `Total` becomes `ঝধঃধত`. Which cells to touch is
a real problem, not an afterthought — see [Detection](#detection) below.

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
npm test        # conversion + detection tests
```

## Unicode and Avro are the same thing

Avro is a keyboard layout that types Unicode directly — it has no encoding of its
own. Converting Bijoy to Unicode is exactly what "converting to Avro" means, and
the output here is what Avro would have produced.

## Corrections to the published glyph table

The mapping in [`src/lib/bijoy.ts`](src/lib/bijoy.ts) is Abdullah Ibne Alam's,
by way of [`bahar/BijoyToUnicode`](https://github.com/bahar/BijoyToUnicode) — the
table most Bijoy converters copy. Checked against real SutonnyMJ workbooks, three
of its slots produce wrong Bangla:

| byte | published | correct | evidence |
| --- | --- | --- | --- |
| `0xF8` | `স্ন` | `্ল` | `Djøvn` is উল্লাহ, not উলস্না |
| `0xE6` | `ম্ন` | `ু` | `bRiæj` is নজরুল, not নজরম্নল |
| — | `য` + `়` | `য়` (U+09DF) | decomposed nukta breaks vowel re-ordering, so `Ry‡qj` came out জুযে়ল instead of জুয়েল |

`npm test` locks these in, so they can't quietly regress back to the upstream
values.

## Detection

[`src/lib/detect.ts`](src/lib/detect.ts) decides which cells are Bijoy.

The clean approach is to read each cell's font and convert only the ones set in
SutonnyMJ. That is not available: legacy `.xls` does not expose fonts to any
JavaScript reader. So the decision comes from the text itself. Each string is
scored on signals that separate mojibake from English:

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

Measured against 589 distinct strings from five real Bijoy rent ledgers and a
control set of ordinary English spreadsheet headings, this misfiles none of either.

## What survives the round trip

[`src/lib/convert.ts`](src/lib/convert.ts) reads and rewrites the workbook.

**`.xlsx`** goes through ExcelJS, which round-trips fonts, fills, borders, merges,
column widths and number formats — only the text changes. Converted cells get a
Unicode Bangla font stamped on them; untouched cells keep what they had. Formulas
keep their formula and only the cached result text is rewritten. Rich text is
converted run by run, so per-run bold and italic survive.

> **Gotcha worth knowing if you use ExcelJS:** it hands every cell sharing an XF
> record the *same* style object, so assigning `cell.font` restyles unrelated cells
> across the sheet. The fix is to detach a copy of the style first.

**`.xls`** goes through SheetJS, the only reader that handles BIFF8 in a browser.
Merged cells, column widths, row heights and number formats carry across, but the
1997 format does not expose fonts, colours or borders to any browser reader — those
are lost regardless of the tool. Open the result and apply a Bangla font to get the
look back.

## Options

| | |
| --- | --- |
| **Bangla cells only** | default; converts what reads as Bijoy, leaves English headings |
| **Only certain matches** | converts cells with Bijoy-only glyphs; misses short words, touches nothing else |
| **Every text cell** | converts all text, English included |
| Sheet tab names | off by default — tabs are usually already English |
| Numbers as Bangla digits | off by default; rewrites number cells as **text**, so totals stop calculating |
| Font for converted cells | Nikosh, Kalpurush, SolaimanLipi, Noto Sans Bengali, Vrinda, or keep the original |

## Built with

Next.js (App Router) · TypeScript · Tailwind · [ExcelJS](https://github.com/exceljs/exceljs) · [SheetJS](https://github.com/SheetJS/sheetjs)

## Licence

[AGPL-3.0](LICENSE), because the glyph map derives from
[`bahar/BijoyToUnicode`](https://github.com/bahar/BijoyToUnicode), which is
AGPL-3.0. Bijoy, SutonnyMJ and Avro belong to their respective owners.
