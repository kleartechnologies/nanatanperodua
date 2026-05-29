"use client";

import type { TweakSettings } from "@/lib/types";

interface Props {
  tweaks: TweakSettings;
  onChange: <K extends keyof TweakSettings>(key: K, value: TweakSettings[K]) => void;
}

function Field({
  label,
  value,
  onChange,
  big,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  big?: boolean;
}) {
  return (
    <label className="block mb-2.5 last:mb-0">
      <span
        className="block text-[10px] font-semibold tracking-[0.1em] uppercase mb-1.5"
        style={{ color: "var(--lc-text-mute)" }}
      >
        {label}
      </span>
      <input
        className="w-full rounded-[10px] px-[11px] py-[9px] text-[13px] outline-none transition-all"
        style={{
          background: "rgba(0,0,0,0.3)",
          border: "1px solid var(--lc-line)",
          color: "var(--lc-text)",
          fontFamily: big ? "var(--font-display)" : undefined,
          fontWeight: big ? 600 : undefined,
          fontSize: big ? "14px" : undefined,
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => {
          e.target.style.borderColor = "var(--lc-accent-soft)";
          e.target.style.boxShadow = "0 0 0 3px var(--lc-accent-dim)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "var(--lc-line)";
          e.target.style.boxShadow = "none";
        }}
      />
    </label>
  );
}

export function DisplayCopyCard({ tweaks, onChange }: Props) {
  return (
    <section
      className="rounded-[22px] p-4 border backdrop-blur-sm"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0)), rgba(255,255,255,0.012)",
        borderColor: "var(--lc-line)",
      }}
    >
      <div className="flex items-baseline justify-between mb-3.5">
        <div className="text-[13px] font-semibold tracking-[0.02em]">Display copy</div>
        <div className="text-[11px]" style={{ color: "var(--lc-text-dim)" }}>Shown on the stream</div>
      </div>

      <Field
        label="Campaign tag"
        value={tweaks.campaignTag}
        onChange={(v) => onChange("campaignTag", v.toUpperCase())}
      />
      <Field
        label="Headline"
        value={tweaks.headline}
        onChange={(v) => onChange("headline", v)}
        big
      />
      <Field
        label="Subtitle"
        value={tweaks.subtitle}
        onChange={(v) => onChange("subtitle", v)}
      />
    </section>
  );
}
