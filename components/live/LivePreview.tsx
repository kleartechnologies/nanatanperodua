"use client";

import { useState, useEffect, useMemo } from "react";
import type { TweakSettings, CarModel } from "@/lib/types";
import { withAlpha } from "@/lib/utils";
import { SalaryCard } from "./SalaryCard";
import { ResultGrid } from "./ResultGrid";

interface Props {
  tweaks: TweakSettings;
  rows: CarModel[];
  logo: string | null;
  bg: string | null;
  fullscreen: boolean;
  onExit: () => void;
  onReorder?: (newIds: number[]) => void;
}

export function LivePreview({ tweaks, rows, logo, bg, fullscreen, onExit, onReorder }: Props) {
  const [salary, setSalary] = useState(tweaks.salary);

  useEffect(() => { setSalary(tweaks.salary); }, [tweaks.salary]);

  const evaluated = useMemo(
    () => rows.map((r) => ({ ...r, eligible: salary >= r.min })),
    [rows, salary]
  );
  const passCount = evaluated.filter((r) => r.eligible).length;
  const failCount = evaluated.length - passCount;

  return (
    <section
      className="relative flex flex-col overflow-hidden"
      style={{ flex: 1, minWidth: 0, minHeight: 0 }}
    >
      {/* Background layer */}
      <div className="lc-live-bg absolute inset-0 z-0 overflow-hidden">
        {bg ? (
          <img
            src={bg}
            alt=""
            className="w-full h-full object-cover"
            style={{
              filter: tweaks.bgBlur
                ? "blur(3px) saturate(1.2) contrast(1.05) brightness(0.78)"
                : "saturate(1.18) contrast(1.05) brightness(0.85)",
              transform: tweaks.bgBlur ? "scale(1.05)" : "scale(1.02)",
              transition: "filter 0.3s",
            }}
          />
        ) : (
          /* Default professional background — no image uploaded */
          <div
            className="w-full h-full"
            style={{
              background: `
                radial-gradient(ellipse 70% 55% at 60% 30%, var(--lc-accent-dim), transparent 65%),
                radial-gradient(ellipse 55% 45% at 20% 75%, rgba(30,120,180,0.14), transparent 65%),
                radial-gradient(ellipse 80% 60% at 50% 50%, rgba(10,30,40,0.6), transparent 80%),
                linear-gradient(160deg, #0c1a20 0%, #0a1520 40%, #080f18 70%, #06080a 100%)
              `,
            }}
          />
        )}

        {/* Tint */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, rgba(8,16,18,0.18) 0%, rgba(8,16,18,0.42) 100%), linear-gradient(135deg, rgba(0,40,50,0.18), rgba(0,0,0,0.05) 60%)",
          }}
        />
        {/* Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 90% 80% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)" }}
        />
        {/* Center bloom */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 60% 50% at 50% 42%, ${withAlpha(tweaks.accent, 0.14)}, transparent 70%),
              radial-gradient(ellipse 80% 40% at 50% 55%, rgba(180,240,255,0.06), transparent 70%)
            `,
            filter: "blur(2px)",
          }}
        />
      </div>

      {/* Exit fullscreen button */}
      {fullscreen && (
        <button
          className="absolute top-[18px] right-[18px] z-10 px-3.5 py-2 rounded-full text-[12px] text-white"
          style={{
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid var(--lc-line)",
          }}
          onClick={onExit}
        >
          ✕ Exit
        </button>
      )}

      {/* Stage */}
      <div
        className={`lc-stage relative z-[2] flex-1 flex flex-col items-center gap-[14px] min-h-0 ${fullscreen ? "overflow-hidden lc-stage-pad-fs" : "overflow-y-auto lc-stage-pad"}`}
      >
        {/* Hero */}
        <div className="flex flex-col items-center gap-2.5 text-center w-full flex-shrink-0">
          {/* Campaign tag */}
          <div
            className="inline-flex items-center gap-[7px] px-3.5 py-[6px] rounded-full text-[11px] font-semibold tracking-[0.18em] text-white/95"
            style={{
              background: "rgba(8,14,18,0.5)",
              backdropFilter: "blur(14px) saturate(1.2)",
              WebkitBackdropFilter: "blur(14px) saturate(1.2)",
              border: "1px solid var(--lc-line-strong)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: tweaks.accent, boxShadow: `0 0 10px ${tweaks.accent}` }}
            />
            {tweaks.campaignTag}
          </div>

          {/* Logo — hidden when none uploaded */}
          {logo && (
            <div className="lc-hero-logo mt-1 flex items-center">
              <img src={logo} alt="Company logo" className="h-full w-auto object-contain max-w-[180px]" />
            </div>
          )}

          {/* Headline */}
          <h1
            className="lc-hero-headline font-extrabold text-white m-0 mt-1.5 text-balance"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 3.4vw, 48px)",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              textShadow: "0 4px 30px rgba(0,0,0,0.6)",
            }}
          >
            {tweaks.headline}
          </h1>

          {/* Subtitle */}
          <div
            className="mt-1"
            style={{ fontSize: "clamp(13px, 1.2vw, 17px)", color: "rgba(255,255,255,0.78)" }}
          >
            {tweaks.subtitle}
          </div>
        </div>

        {/* Salary card */}
        <div className="w-full flex justify-center flex-shrink-0 px-0" style={{ maxWidth: 680 }}>
          <SalaryCard
            salary={salary}
            onSalaryChange={setSalary}
            passCount={passCount}
            failCount={failCount}
            accent={tweaks.accent}
          />
        </div>

        {/* Result grid */}
        <ResultGrid
          rows={evaluated}
          displayMode={tweaks.displayMode}
          accent={tweaks.accent}
          fullscreen={fullscreen}
          onReorder={onReorder}
        />

        {/* Disclaimer */}
        <div
          className="flex items-center gap-1.5 text-[11px] tracking-[0.04em] flex-shrink-0"
          style={{ color: "rgba(255,255,255,0.4)", marginTop: fullscreen ? 0 : -4 }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16v.5" />
          </svg>
          Anggaran sahaja. Tertakluk kepada penilaian kredit bank.
        </div>
      </div>
    </section>
  );
}
