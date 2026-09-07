'use client';

import type { ConvertOptions, DetectionMode } from '@/lib/convert';

type Props = {
  value: ConvertOptions;
  onChange: (next: ConvertOptions) => void;
  disabled: boolean;
};

const MODES: Array<{ id: DetectionMode; label: string; help: string }> = [
  {
    id: 'auto',
    label: 'Bangla cells only',
    help: 'Converts text that reads as Bijoy and leaves English headings as they are.',
  },
  {
    id: 'strict',
    label: 'Only certain matches',
    help: 'Converts cells carrying Bijoy-only glyphs. Misses some short words, touches nothing else.',
  },
  {
    id: 'all',
    label: 'Every text cell',
    help: 'Converts all text, English included. For files that are Bangla end to end.',
  },
];

const FONTS = ['Nikosh', 'Kalpurush', 'SolaimanLipi', 'Noto Sans Bengali', 'Vrinda'];

export function OptionsPanel({ value, onChange, disabled }: Props) {
  const set = <K extends keyof ConvertOptions>(key: K, v: ConvertOptions[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <section className="matra">
      <h2 className="px-6 pt-4 pb-5 text-[13px] font-medium text-muted">Conversion settings</h2>

      <div className="grid gap-8 px-6 pb-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <fieldset disabled={disabled}>
          <legend className="text-[15px] font-semibold text-ink mb-3">Which cells to convert</legend>
          <div className="space-y-3">
            {MODES.map((m) => (
              <label key={m.id} className="flex gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="mode"
                  checked={value.mode === m.id}
                  onChange={() => set('mode', m.id)}
                  className="mt-1 h-4 w-4 shrink-0 accent-[var(--green)]"
                />
                <span>
                  <span className="block text-[15px] text-ink group-hover:text-green">{m.label}</span>
                  <span className="block text-[13px] leading-snug text-muted max-w-[52ch]">{m.help}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-6">
          <fieldset disabled={disabled}>
            <legend className="text-[15px] font-semibold text-ink mb-3">Also convert</legend>
            <label className="flex gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={value.sheetNames}
                onChange={(e) => set('sheetNames', e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--green)]"
              />
              <span>
                <span className="block text-[15px] text-ink">Sheet tab names</span>
                <span className="block text-[13px] leading-snug text-muted">
                  Off by default — tabs are usually already in English.
                </span>
              </span>
            </label>

            <label className="mt-3 flex gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={value.numbersToBanglaDigits}
                onChange={(e) => set('numbersToBanglaDigits', e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--green)]"
              />
              <span>
                <span className="block text-[15px] text-ink">Numbers as Bangla digits</span>
                <span className="block text-[13px] leading-snug text-muted">
                  Rewrites number cells as text. Totals and formulas stop calculating.
                </span>
              </span>
            </label>
          </fieldset>

          <div>
            <label htmlFor="font" className="block text-[15px] font-semibold text-ink mb-2">
              Font for converted cells
            </label>
            <select
              id="font"
              disabled={disabled}
              value={value.outputFont}
              onChange={(e) => set('outputFont', e.target.value)}
              className="w-full max-w-xs rounded border border-rule bg-paper px-3 py-2 text-[15px] text-ink"
            >
              {FONTS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
              <option value="">Keep the original font</option>
            </select>
            <p className="mt-2 text-[13px] leading-snug text-muted max-w-[46ch]">
              Applied to .xlsx files. Legacy .xls files arrive without font information, so their
              output uses Excel&rsquo;s default.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
