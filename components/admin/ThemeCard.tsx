"use client";

import { ACCENT_COLORS } from "@/lib/constants";
import type { TweakSettings } from "@/lib/types";

interface Props {
  accent: TweakSettings["accent"];
  onChange: (color: string) => void;
}

export function ThemeCard({ accent, onChange }: Props) {
  return (
    <section
      className="rounded-[22px] p-4 border backdrop-blur-sm"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0)), rgba(255,255,255,0.012)",
        borderColor: "var(--lc-line)",
      }}
    >
      <div className="flex items-baseline justify-between mb-3.5">
        <div className="text-[13px] font-semibold tracking-[0.02em]">Theme</div>
        <div className="text-[11px]" style={{ color: "var(--lc-text-dim)" }}>Accent color</div>
      </div>

      <div className="flex gap-2">
        {ACCENT_COLORS.map((c) => (
          <button
            key={c}
            className="relative w-9 h-9 rounded-[10px] p-0 transition-transform hover:-translate-y-px"
            style={{
              background: c,
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: accent === c ? `0 0 0 2px var(--lc-bg-1), 0 0 0 3px ${c}` : undefined,
            }}
            onClick={() => onChange(c)}
          >
            {accent === c && (
              <span
                className="absolute inset-0 flex items-center justify-center text-sm font-black"
                style={{ color: "rgba(0,0,0,0.7)" }}
              >
                ✓
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
