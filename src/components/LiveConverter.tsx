'use client';

import { useMemo, useState } from 'react';
import { bijoyToUnicode } from '@/lib/bijoy';

const SEED = `cÖwZôv‡bi bvg: LvRv mycvi gv‡K©U
KviLvbv bs 4we-407, fvovi cwigvb 12,500`;

export function LiveConverter() {
  const [text, setText] = useState(SEED);
  const output = useMemo(() => bijoyToUnicode(text), [text]);

  return (
    <div className="matra">
      <div className="grid md:grid-cols-2">
        <div className="p-5 md:p-6 md:border-r border-rule">
          <label
            htmlFor="live-in"
            className="block text-[13px] font-medium text-muted mb-3"
          >
            Bijoy, as the file stores it
          </label>
          <textarea
            id="live-in"
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            rows={3}
            className="mojibake w-full resize-none bg-transparent text-[15px] leading-7 text-ink-soft placeholder:text-muted focus:outline-none"
            placeholder="Paste Bijoy text here"
          />
        </div>

        <div className="p-5 md:p-6 border-t md:border-t-0 border-rule bg-wash/60">
          <p className="text-[13px] font-medium text-green mb-3">Unicode, as everything else reads it</p>
          <output
            htmlFor="live-in"
            aria-live="polite"
            className="bangla block text-[17px] text-ink whitespace-pre-wrap break-words min-h-[5.25rem]"
          >
            {output || <span className="text-muted">Nothing to convert yet.</span>}
          </output>
        </div>
      </div>
    </div>
  );
}
