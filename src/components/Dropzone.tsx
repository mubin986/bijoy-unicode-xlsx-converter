'use client';

import { useRef, useState, type DragEvent } from 'react';

type Props = {
  onFiles: (files: File[]) => void;
  busy: boolean;
};

const ACCEPTED = /\.(xlsx|xls)$/i;

export function Dropzone({ onFiles, busy }: Props) {
  const [over, setOver] = useState(false);
  const [rejected, setRejected] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);

  function take(list: FileList | null) {
    if (!list) return;
    const all = Array.from(list);
    const ok = all.filter((f) => ACCEPTED.test(f.name));
    setRejected(all.filter((f) => !ACCEPTED.test(f.name)).map((f) => f.name));
    if (ok.length) onFiles(ok);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setOver(false);
    take(e.dataTransfer.files);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={`px-6 py-12 md:py-16 text-center transition-colors ${
          over ? 'bg-green-wash' : 'bg-wash/50'
        }`}
      >
        <p className="display text-[clamp(1.5rem,3.2vw,2.25rem)] text-ink">
          Drop your spreadsheets here
        </p>
        <p className="mt-3 text-[15px] text-ink-soft">
          .xlsx and legacy .xls, as many at once as you like.
        </p>
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="mt-6 inline-flex items-center rounded bg-green px-5 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-green-deep disabled:opacity-50"
        >
          {busy ? 'Converting…' : 'Choose files'}
        </button>
        <input
          ref={input}
          type="file"
          multiple
          accept=".xlsx,.xls"
          className="sr-only"
          onChange={(e) => {
            take(e.target.files);
            e.target.value = '';
          }}
        />
        <p className="mt-6 text-[13px] text-muted">
          Nothing is uploaded. Files are read and rewritten in this browser tab.
        </p>
      </div>

      {rejected.length > 0 && (
        <p className="matra-thin px-6 py-3 text-[13px] text-red bg-red-wash">
          Skipped {rejected.join(', ')} — this converter only reads .xlsx and .xls.
        </p>
      )}
    </div>
  );
}
