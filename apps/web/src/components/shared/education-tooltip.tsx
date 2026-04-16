"use client";

import { useState } from "react";

interface EducationTooltipProps {
  text: string;
}

export function EducationTooltip({ text }: EducationTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        onClick={() => setOpen(!open)}
        onBlur={() => setOpen(false)}
        className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-[rgba(113,113,122,0.3)] text-[10px] font-semibold text-[var(--text-muted)] hover:bg-[rgba(113,113,122,0.5)] transition-colors"
        aria-label="More info"
      >
        ?
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 w-[280px] -translate-x-1/2 rounded-lg border border-[var(--border-hover)] bg-[#2a2a2e] p-3 text-[13px] leading-relaxed text-[var(--text-secondary)] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          {text}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-[6px] border-transparent border-t-[#2a2a2e]" />
        </div>
      )}
    </span>
  );
}
