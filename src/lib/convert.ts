import type { CellObject } from 'xlsx';

import { bijoyToUnicode } from './bijoy';
import { classify, workbookLeansBijoy, type Classification, type Verdict } from './detect';

export type DetectionMode = 'auto' | 'strict' | 'all';

export type ConvertOptions = {
  mode: DetectionMode;
  sheetNames: boolean;
  numbersToBanglaDigits: boolean;
  /** Font to stamp on converted cells. Empty string keeps whatever the cell had. */
  outputFont: string;
};

export const DEFAULT_OPTIONS: ConvertOptions = {
  mode: 'auto',
  sheetNames: false,
  numbersToBanglaDigits: false,
  outputFont: 'Nikosh',
};

export type CellChange = {
  sheet: string;
  ref: string;
  before: string;
  after: string;
  verdict: Verdict;
  reasons: string[];
};

export type FileReport = {
  name: string;
  outName: string;
  size: number;
  format: 'xlsx' | 'xls';
  sheets: number;
  scanned: number;
  converted: number;
  leftAsEnglish: number;
  alreadyUnicode: number;
  neutralConverted: boolean;
  changes: CellChange[];
  totalChanges: number;
  blob: Blob;
};

const PREVIEW_LIMIT = 400;

const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBanglaDigits(text: string): string {
  return text.replace(/[0-9]/g, (d) => BANGLA_DIGITS[Number(d)]);
}

/** One convertible piece of text, with the closure that writes the result back. */
type Target = {
  sheet: string;
  ref: string;
  text: string;
  cls: Classification;
  write: (converted: string) => void;
};

type Parsed = {
  targets: Target[];
  sheets: number;
  /** Numeric cells, only touched when the Bangla-digits option is on. */
  numerics: Array<{ write: () => void }>;
  build: () => Promise<ArrayBuffer>;
};

const yieldToUi = () => new Promise((r) => setTimeout(r, 0));

function shouldConvert(v: Verdict, mode: DetectionMode, neutralCounts: boolean): boolean {
  if (v === 'already-unicode' || v === 'empty') return false;
  if (mode === 'all') return true;
  if (v === 'bijoy') return true;
  if (v === 'neutral') return mode === 'auto' && neutralCounts;
  return false;
}

export async function convertFile(
  file: File,
  options: ConvertOptions,
  onProgress?: (fraction: number, label: string) => void,
): Promise<FileReport> {
  const buffer = await file.arrayBuffer();
  const format: 'xlsx' | 'xls' = /\.xlsx$/i.test(file.name) || isZip(buffer) ? 'xlsx' : 'xls';

  onProgress?.(0.1, 'Reading workbook');
  const parsed =
    format === 'xlsx'
      ? await parseXlsx(buffer, options)
      : await parseXls(buffer, options);

  onProgress?.(0.45, 'Checking cells');

  let bijoy = 0;
  let english = 0;
  let alreadyUnicode = 0;
  for (const t of parsed.targets) {
    if (t.cls.verdict === 'bijoy') bijoy += 1;
    else if (t.cls.verdict === 'english') english += 1;
    else if (t.cls.verdict === 'already-unicode') alreadyUnicode += 1;
  }

  const neutralCounts = workbookLeansBijoy(bijoy, english);
  const changes: CellChange[] = [];
  let converted = 0;

  for (let i = 0; i < parsed.targets.length; i++) {
    const t = parsed.targets[i];
    if (!shouldConvert(t.cls.verdict, options.mode, neutralCounts)) continue;

    const after = bijoyToUnicode(t.text);
    if (after === t.text) continue;

    t.write(after);
    converted += 1;
    if (changes.length < PREVIEW_LIMIT) {
      changes.push({
        sheet: t.sheet,
        ref: t.ref,
        before: t.text,
        after,
        verdict: t.cls.verdict,
        reasons: t.cls.reasons,
      });
    }
    if (i % 2000 === 0) await yieldToUi();
  }

  if (options.numbersToBanglaDigits) {
    for (const n of parsed.numerics) n.write();
  }

  onProgress?.(0.8, 'Writing .xlsx');
  const out = await parsed.build();

  return {
    name: file.name,
    outName: file.name.replace(/\.(xlsx|xls)$/i, '') + ' — unicode.xlsx',
    size: file.size,
    format,
    sheets: parsed.sheets,
    scanned: parsed.targets.length,
    converted,
    leftAsEnglish: english,
    alreadyUnicode,
    neutralConverted: neutralCounts,
    changes,
    totalChanges: converted,
    blob: new Blob([out], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
  };
}

function isZip(buffer: ArrayBuffer): boolean {
  const b = new Uint8Array(buffer, 0, Math.min(4, buffer.byteLength));
  return b[0] === 0x50 && b[1] === 0x4b;
}

/* ---------------------------------------------------------------- .xlsx --- */
// ExcelJS round-trips fonts, fills, borders, merges and number formats, so a
// converted .xlsx keeps the look of the original and only the text changes.

async function parseXlsx(buffer: ArrayBuffer, options: ConvertOptions): Promise<Parsed> {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const targets: Target[] = [];
  const numerics: Array<{ write: () => void }> = [];
  const renames: Array<[import('exceljs').Worksheet, string]> = [];

  wb.eachSheet((ws) => {
    if (options.sheetNames) {
      const cls = classify(ws.name);
      targets.push({
        sheet: ws.name,
        ref: 'sheet name',
        text: ws.name,
        cls,
        write: (v) => renames.push([ws, v]),
      });
    }

    ws.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        // ExcelJS hands every cell sharing an XF record the *same* style object,
        // so `cell.font = …` would restyle untouched cells elsewhere in the
        // sheet. Detach a copy first, then set the font on that.
        const stampFont = () => {
          if (!options.outputFont) return;
          cell.style = {
            ...cell.style,
            font: { ...(cell.style?.font ?? {}), name: options.outputFont },
          };
        };
        const value = cell.value;

        if (typeof value === 'string') {
          targets.push({
            sheet: ws.name,
            ref: cell.address,
            text: value,
            cls: classify(value),
            write: (v) => {
              cell.value = v;
              stampFont();
            },
          });
          return;
        }

        if (typeof value === 'number' && options.numbersToBanglaDigits) {
          numerics.push({
            write: () => {
              cell.value = toBanglaDigits(cell.text ?? String(value));
              stampFont();
            },
          });
          return;
        }

        if (!value || typeof value !== 'object') return;

        if ('richText' in value && Array.isArray(value.richText)) {
          const runs = value.richText;
          const joined = runs.map((r) => r.text).join('');
          targets.push({
            sheet: ws.name,
            ref: cell.address,
            text: joined,
            cls: classify(joined),
            write: () => {
              cell.value = {
                richText: runs.map((run) => ({
                  ...run,
                  text: bijoyToUnicode(run.text),
                  font: options.outputFont
                    ? { ...(run.font ?? {}), name: options.outputFont }
                    : run.font,
                })),
              };
            },
          });
          return;
        }

        // A formula's cached result: rewrite the cached text, keep the formula.
        if (('formula' in value || 'sharedFormula' in value) && typeof value.result === 'string') {
          const result = value.result;
          targets.push({
            sheet: ws.name,
            ref: cell.address,
            text: result,
            cls: classify(result),
            write: (v) => {
              cell.value = { ...value, result: v } as typeof value;
              stampFont();
            },
          });
          return;
        }

        if ('hyperlink' in value && typeof value.text === 'string') {
          const text = value.text;
          targets.push({
            sheet: ws.name,
            ref: cell.address,
            text,
            cls: classify(text),
            write: (v) => {
              cell.value = { ...value, text: v };
              stampFont();
            },
          });
        }
      });
    });
  });

  return {
    targets,
    numerics,
    sheets: wb.worksheets.length,
    build: async () => {
      for (const [ws, name] of renames) ws.name = name;
      return wb.xlsx.writeBuffer() as Promise<ArrayBuffer>;
    },
  };
}

/* ----------------------------------------------------------------- .xls --- */
// Legacy BIFF8. SheetJS is the only reader that handles it in the browser; it
// carries merges, column widths, row heights and number formats across, but
// not cell fonts or colours — those are lost no matter what we do here.

async function parseXls(buffer: ArrayBuffer, options: ConvertOptions): Promise<Parsed> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(new Uint8Array(buffer), {
    type: 'array',
    cellStyles: true,
    cellNF: true,
    cellDates: true,
  });

  const targets: Target[] = [];
  const numerics: Array<{ write: () => void }> = [];
  const renames = new Map<string, string>();

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    if (options.sheetNames) {
      targets.push({
        sheet: sheetName,
        ref: 'sheet name',
        text: sheetName,
        cls: classify(sheetName),
        write: (v) => renames.set(sheetName, v),
      });
    }

    for (const address of Object.keys(ws)) {
      if (address.startsWith('!')) continue;
      const cell = (ws as Record<string, CellObject>)[address];
      if (!cell) continue;

      if (cell.t === 's' && typeof cell.v === 'string') {
        targets.push({
          sheet: sheetName,
          ref: address,
          text: cell.v,
          cls: classify(cell.v),
          write: (v) => {
            cell.v = v;
            // Drop the cached display text and rich-text runs so Excel re-renders.
            delete cell.w;
            delete cell.h;
            delete cell.r;
          },
        });
        continue;
      }

      if (cell.t === 'n' && typeof cell.v === 'number' && options.numbersToBanglaDigits) {
        numerics.push({
          write: () => {
            const shown = cell.w ?? String(cell.v);
            cell.t = 's';
            cell.v = toBanglaDigits(shown);
            delete cell.w;
            delete cell.z;
          },
        });
      }
    }
  }

  return {
    targets,
    numerics,
    sheets: wb.SheetNames.length,
    build: async () => {
      if (renames.size) {
        wb.SheetNames = wb.SheetNames.map((n) => renames.get(n) ?? n);
        for (const [from, to] of renames) {
          if (from === to) continue;
          wb.Sheets[to] = wb.Sheets[from];
          delete wb.Sheets[from];
        }
      }
      return XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
    },
  };
}
