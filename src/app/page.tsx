'use client';

import { useCallback, useRef, useState } from 'react';
import { LiveConverter } from '@/components/LiveConverter';
import { Dropzone } from '@/components/Dropzone';
import { OptionsPanel } from '@/components/OptionsPanel';
import { FileReportCard, type Job } from '@/components/FileReportCard';
import { convertFile, DEFAULT_OPTIONS, type ConvertOptions } from '@/lib/convert';

export default function Home() {
  const [options, setOptions] = useState<ConvertOptions>(DEFAULT_OPTIONS);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [busy, setBusy] = useState(false);
  const [stale, setStale] = useState(false);
  const files = useRef(new Map<string, File>());

  const run = useCallback(async (queue: Array<{ id: string; file: File }>, opts: ConvertOptions) => {
    setBusy(true);
    for (const { id, file } of queue) {
      const patch = (next: Partial<Job>) =>
        setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...next } : j)));

      patch({ status: 'working', progress: 0.05, label: 'Reading workbook', report: undefined });
      try {
        const report = await convertFile(file, opts, (progress, label) =>
          patch({ progress, label }),
        );
        patch({ status: 'done', progress: 1, label: 'Done', report });
      } catch (e) {
        patch({
          status: 'error',
          error:
            e instanceof Error
              ? `Could not read this file — ${e.message}`
              : 'Could not read this file.',
        });
      }
    }
    setBusy(false);
    setStale(false);
  }, []);

  const onFiles = useCallback(
    (incoming: File[]) => {
      const queue = incoming.map((file) => {
        const id = `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`;
        files.current.set(id, file);
        return { id, file };
      });
      setJobs((prev) => [
        ...prev,
        ...queue.map(({ id, file }) => ({
          id,
          fileName: file.name,
          status: 'working' as const,
          progress: 0,
          label: 'Queued',
        })),
      ]);
      void run(queue, options);
    },
    [options, run],
  );

  const reapply = useCallback(() => {
    const queue = jobs
      .map((j) => ({ id: j.id, file: files.current.get(j.id) }))
      .filter((x): x is { id: string; file: File } => Boolean(x.file));
    void run(queue, options);
  }, [jobs, options, run]);

  function changeOptions(next: ConvertOptions) {
    setOptions(next);
    if (jobs.length) setStale(true);
  }

  return (
    <div className="mx-auto w-full max-w-[72rem] px-4 md:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 py-6">
        <p className="flex items-baseline gap-2.5 text-[15px]">
          <span className="mojibake text-muted">KviLvbv</span>
          <span aria-hidden className="text-rule">/</span>
          <span className="bangla font-medium text-green">কারখানা</span>
        </p>
        <p className="text-[13px] text-muted">Bijoy and SutonnyMJ spreadsheets, converted in your browser</p>
      </header>

      <main className="pb-24">
        <section className="pt-6 pb-10 md:pt-10 md:pb-14">
          <h1 className="display max-w-[16ch] text-[clamp(2.5rem,7vw,4.75rem)] text-ink">
            Old Bangla files, readable everywhere.
          </h1>
          <p className="mt-6 max-w-[62ch] text-[17px] leading-relaxed text-ink-soft">
            Bijoy stores Bangla as ASCII, so a spreadsheet full of{' '}
            <span className="mojibake text-muted">KviLvbv bs</span> only reads correctly on a
            computer with SutonnyMJ installed. This rewrites it as Unicode —{' '}
            <span className="bangla text-ink">কারখানা নং</span> — which searches, sorts and copies
            properly in Excel, Sheets, and anywhere else.
          </p>
        </section>

        <section className="mb-14">
          <LiveConverter />
        </section>

        <section className="mb-14">
          <div className="matra">
            <Dropzone onFiles={onFiles} busy={busy} />
          </div>
        </section>

        {jobs.length > 0 && (
          <section className="mb-14">
            <div className="matra flex flex-wrap items-baseline justify-between gap-4 px-6 pt-4 pb-1">
              <h2 className="text-[13px] font-medium text-muted">
                {jobs.length} {jobs.length === 1 ? 'file' : 'files'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setJobs([]);
                  files.current.clear();
                  setStale(false);
                }}
                disabled={busy}
                className="text-[13px] font-medium text-muted hover:text-ink disabled:opacity-50"
              >
                Clear all
              </button>
            </div>
            {jobs.map((job) => (
              <FileReportCard key={job.id} job={job} />
            ))}
          </section>
        )}

        <section className="mb-14">
          <OptionsPanel value={options} onChange={changeOptions} disabled={busy} />
          {stale && (
            <div className="matra-thin flex flex-wrap items-center justify-between gap-4 bg-green-wash px-6 py-4">
              <p className="text-[14px] text-ink">
                Settings changed. Your converted files still use the old ones.
              </p>
              <button
                type="button"
                onClick={reapply}
                disabled={busy}
                className="rounded bg-green px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-green-deep disabled:opacity-50"
              >
                Convert again
              </button>
            </div>
          )}
        </section>

        <section className="matra pt-5">
          <h2 className="text-[15px] font-semibold text-ink">What to expect</h2>
          <div className="mt-5 grid gap-x-10 gap-y-6 md:grid-cols-3 text-[14px] leading-relaxed text-ink-soft">
            <p>
              <strong className="font-semibold text-ink">Your files stay put.</strong> Reading and
              rewriting happen in this tab. Nothing is sent anywhere, so the tool works offline once
              the page has loaded.
            </p>
            <p>
              <strong className="font-semibold text-ink">English survives.</strong> Bijoy is ASCII,
              so a blind conversion would turn <em>Total</em> into nonsense. Cells are judged
              individually and English headings are left alone.
            </p>
            <p>
              <strong className="font-semibold text-ink">Everything comes back as .xlsx</strong>, the
              modern format, whichever you put in. Legacy .xls loses its fonts and borders on the way
              through — that limitation is in the format, not the conversion.
            </p>
          </div>
        </section>
      </main>

      <footer className="matra-thin py-6 text-[13px] text-muted">
        Bijoy, SutonnyMJ and Avro are the property of their respective owners. Avro types Unicode
        directly, so the output here is exactly what Avro produces.
      </footer>
    </div>
  );
}
