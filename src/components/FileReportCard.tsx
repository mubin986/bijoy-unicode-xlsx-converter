'use client';

import { useState } from 'react';
import type { FileReport } from '@/lib/convert';

export type Job = {
  id: string;
  fileName: string;
  status: 'working' | 'done' | 'error';
  progress: number;
  label: string;
  report?: FileReport;
  error?: string;
};

const n = (v: number) => v.toLocaleString('en-US');

function Stat({ value, label, tone }: { value: string; label: string; tone?: 'green' | 'muted' }) {
  return (
    <div>
      <div
        className={`text-[22px] leading-none font-semibold tabular-nums ${
          tone === 'green' ? 'text-green' : tone === 'muted' ? 'text-muted' : 'text-ink'
        }`}
      >
        {value}
      </div>
      <div className="mt-1.5 text-[13px] text-muted">{label}</div>
    </div>
  );
}

export function FileReportCard({ job }: { job: Job }) {
  const [expanded, setExpanded] = useState(false);
  const r = job.report;

  function download() {
    if (!r) return;
    const url = URL.createObjectURL(r.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = r.outName;
    a.click();
    URL.revokeObjectURL(url);
  }

  const shown = r ? (expanded ? r.changes : r.changes.slice(0, 12)) : [];

  return (
    <article className="matra-thin py-6">
      <div className="px-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-[17px] font-semibold text-ink break-all">{job.fileName}</h3>
          {r && (
            <p className="mt-1 text-[13px] text-muted">
              {r.format === 'xls' ? 'Legacy .xls' : '.xlsx'} · {n(r.sheets)}{' '}
              {r.sheets === 1 ? 'sheet' : 'sheets'} · {(r.size / 1024).toFixed(0)} KB
            </p>
          )}
        </div>

        {job.status === 'done' && r && (
          <button
            type="button"
            onClick={download}
            className="shrink-0 rounded bg-green px-4 py-2 text-[15px] font-medium text-white transition-colors hover:bg-green-deep"
          >
            Download .xlsx
          </button>
        )}
      </div>

      {job.status === 'working' && (
        <div className="px-6 mt-4">
          <div className="h-[3px] w-full bg-wash-deep overflow-hidden rounded-full">
            <div
              className="h-full bg-green transition-[width] duration-300"
              style={{ width: `${Math.round(job.progress * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-[13px] text-muted">{job.label}</p>
        </div>
      )}

      {job.status === 'error' && (
        <p className="mx-6 mt-4 rounded bg-red-wash px-4 py-3 text-[14px] text-red">
          {job.error}
        </p>
      )}

      {job.status === 'done' && r && (
        <>
          <div className="px-6 mt-5 grid grid-cols-2 sm:grid-cols-4 gap-6">
            <Stat value={n(r.converted)} label="cells converted" tone="green" />
            <Stat value={n(r.scanned)} label="text cells read" />
            <Stat value={n(r.leftAsEnglish)} label="left as English" tone="muted" />
            <Stat value={n(r.alreadyUnicode)} label="already Unicode" tone="muted" />
          </div>

          {r.neutralConverted && (
            <p className="mx-6 mt-5 text-[13px] leading-relaxed text-muted max-w-[70ch]">
              Cells with nothing to go on — room numbers, single words — were converted too, because
              the rest of this workbook is Bangla throughout.
            </p>
          )}

          {r.converted === 0 && (
            <p className="mx-6 mt-5 rounded bg-wash px-4 py-3 text-[14px] text-ink-soft">
              Nothing here looked like Bijoy. If the file really is Bangla, switch to{' '}
              <strong className="font-semibold">Every text cell</strong> below and apply again.
            </p>
          )}

          {r.changes.length > 0 && (
            <div className="mt-6">
              <div className="px-6 flex items-baseline justify-between gap-4">
                <p className="text-[13px] font-medium text-muted">
                  Check the conversion before you download
                </p>
                {r.changes.length > 12 && (
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="text-[13px] font-medium text-green hover:text-green-deep"
                  >
                    {expanded
                      ? 'Show fewer'
                      : `Show ${n(r.changes.length)} sampled cells`}
                  </button>
                )}
              </div>

              <div className={`mt-3 overflow-x-auto ${expanded ? 'max-h-[28rem] overflow-y-auto' : ''}`}>
                <table className="w-full min-w-[42rem] text-left border-collapse">
                  <thead className="sticky top-0 bg-paper">
                    <tr className="matra-thin">
                      <th className="w-40 py-2 pl-6 pr-3 text-[12px] font-medium text-muted align-bottom">
                        Cell
                      </th>
                      <th className="py-2 px-3 text-[12px] font-medium text-muted align-bottom">
                        Bijoy
                      </th>
                      <th className="py-2 pl-3 pr-6 text-[12px] font-medium text-green align-bottom">
                        Unicode
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((c, i) => (
                      <tr key={`${c.sheet}-${c.ref}-${i}`} className="matra-thin align-top">
                        <td
                          className="py-2.5 pl-6 pr-3 text-[12px] text-muted"
                          title={
                            c.reasons.length
                              ? `Detected as Bijoy: ${c.reasons.join(', ')}`
                              : undefined
                          }
                        >
                          <span className="block truncate max-w-[9rem]" title={c.sheet}>
                            {c.sheet}
                          </span>
                          <span className="text-ink-soft">{c.ref}</span>
                        </td>
                        <td className="mojibake py-2.5 px-3 text-[13px] text-muted whitespace-pre-wrap break-words">
                          {c.before}
                        </td>
                        <td className="bangla py-2.5 pl-3 pr-6 text-[15px] text-ink whitespace-pre-wrap break-words">
                          {c.after}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {r.converted > r.changes.length && (
                <p className="px-6 mt-3 text-[13px] text-muted">
                  Showing the first {n(r.changes.length)} of {n(r.converted)} converted cells. All of
                  them are in the download.
                </p>
              )}
            </div>
          )}

          {r.format === 'xls' && (
            <p className="mx-6 mt-6 rounded bg-wash px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
              Legacy .xls keeps its merged cells, column widths and number formats, but Excel&rsquo;s
              1997 format does not expose fonts, colours or borders to any browser reader — those are
              not carried over. Open the result and apply a Bangla font to get the look back.
            </p>
          )}
        </>
      )}
    </article>
  );
}
