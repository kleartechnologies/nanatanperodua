"use client";

import type { TweakSettings } from "@/lib/types";

interface Props {
  displayMode: TweakSettings["displayMode"];
  bgBlur: TweakSettings["bgBlur"];
  onChange: <K extends keyof TweakSettings>(key: K, value: TweakSettings[K]) => void;
}

export function DisplaySettingsCard({ displayMode, bgBlur, onChange }: Props) {
  return (
    <section
      className="rounded-[22px] p-4 border backdrop-blur-sm"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0)), rgba(255,255,255,0.012)",
        borderColor: "var(--lc-line)",
      }}
    >
      <div className="flex items-baseline justify-between mb-3.5">
        <div className="text-[13px] font-semibold tracking-[0.02em]">Display settings</div>
        <div className="text-[11px]" style={{ color: "var(--lc-text-dim)" }}>Visual style</div>
      </div>

      {/* Card style segmented control */}
      <div className="flex items-center justify-between gap-2.5 mb-3">
        <span className="text-[12px]" style={{ color: "var(--lc-text)" }}>Card style</span>
        <div
          className="inline-grid gap-0.5 p-[3px] rounded-[10px]"
          style={{
            gridAutoColumns: "60px",
            gridAutoFlow: "column",
            background: "rgba(0,0,0,0.3)",
            border: "1px solid var(--lc-line)",
          }}
        >
          {(["glow", "flat"] as const).map((v) => (
            <button
              key={v}
              className="text-[12px] font-medium px-2 py-1.5 rounded-[7px] capitalize transition-colors"
              style={{
                background: displayMode === v ? "rgba(255,255,255,0.06)" : "transparent",
                border: 0,
                color: displayMode === v ? "var(--lc-text)" : "var(--lc-text-mute)",
              }}
              onClick={() => onChange("displayMode", v)}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Background blur toggle */}
      <label className="flex justify-between items-center cursor-pointer">
        <span className="text-[12px]" style={{ color: "var(--lc-text)" }}>Background blur</span>
        <button
          className="relative p-0"
          style={{
            width: 36,
            height: 20,
            borderRadius: 999,
            background: bgBlur ? "var(--lc-accent)" : "rgba(255,255,255,0.08)",
            border: 0,
            transition: "background 0.2s",
          }}
          onClick={() => onChange("bgBlur", !bgBlur)}
        >
          <span
            className="absolute block rounded-full bg-white"
            style={{
              top: 2,
              left: 2,
              width: 16,
              height: 16,
              transition: "transform 0.2s",
              transform: bgBlur ? "translateX(16px)" : "translateX(0)",
            }}
          />
        </button>
      </label>
    </section>
  );
}
