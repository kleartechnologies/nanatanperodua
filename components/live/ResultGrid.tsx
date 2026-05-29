"use client";

import { formatRM } from "@/lib/utils";

interface EvaluatedRow {
  id: number;
  model: string;
  min: number;
  variants: string[];
  eligible: boolean;
}

interface Props {
  rows: EvaluatedRow[];
  displayMode: "glow" | "flat";
  accent: string;
  fullscreen?: boolean;
}

export function ResultGrid({ rows, displayMode, accent, fullscreen }: Props) {
  return (
    <div className={fullscreen ? "lc-result-grid lc-result-grid-fs" : "lc-result-grid"}>
      {rows.map((r) => (
        <div
          key={r.id}
          className={`lc-result-card lc-${displayMode} ${r.eligible ? "lc-result-pass" : "lc-result-fail"} relative rounded-[18px] flex flex-col justify-between gap-2.5 overflow-hidden transition-transform hover:-translate-y-0.5`}
          style={{
            padding: "16px 18px",
            backdropFilter: displayMode === "flat" ? "blur(10px)" : "blur(18px) saturate(1.15)",
            border: `1px solid ${r.eligible
              ? `color-mix(in oklab, ${accent} 35%, transparent)`
              : "color-mix(in oklab, var(--lc-fail) 30%, transparent)"}`,
            background: r.eligible
              ? `linear-gradient(180deg, color-mix(in oklab, ${accent} 10%, transparent), rgba(0,0,0,0.05)), rgba(10,18,14,0.9)`
              : "linear-gradient(180deg, color-mix(in oklab, var(--lc-fail) 8%, transparent), rgba(0,0,0,0.05)), rgba(18,12,12,0.9)",
            boxShadow: displayMode === "glow"
              ? r.eligible
                ? `0 16px 40px rgba(0,0,0,0.4), 0 0 30px color-mix(in oklab, ${accent} 18%, transparent), inset 0 1px 0 rgba(255,255,255,0.06)`
                : "0 16px 40px rgba(0,0,0,0.4), 0 0 26px color-mix(in oklab, var(--lc-fail) 14%, transparent), inset 0 1px 0 rgba(255,255,255,0.04)"
              : "none",
            minHeight: fullscreen ? 0 : undefined,
            minWidth: 0,
          }}
        >
          {/* Card head */}
          <div className="flex items-center justify-between gap-2.5 relative z-[1]">
            <div
              className="font-extrabold tracking-[0.03em] text-white"
              style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px, 1.9vw, 30px)" }}
            >
              {r.model}
            </div>
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-[12px] tracking-[0.12em] flex-shrink-0"
              style={{
                fontFamily: "var(--font-display)",
                background: r.eligible ? accent : "rgba(0,0,0,0.5)",
                color: r.eligible ? "#001005" : "var(--lc-fail)",
                border: r.eligible ? "none" : `1px solid color-mix(in oklab, var(--lc-fail) 50%, transparent)`,
                boxShadow: r.eligible ? `0 0 14px color-mix(in oklab, ${accent} 50%, transparent)` : "none",
              }}
            >
              {r.eligible ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M5 13l4 4 10-10" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9 9l6 6M15 9l-6 6" />
                </svg>
              )}
              {r.eligible ? "LULUS" : "GAGAL"}
            </div>
          </div>

          {/* Card body */}
          <div className="relative z-[1] min-h-9 flex items-start">
            {r.eligible ? (
              <div className="flex flex-wrap gap-1.5">
                {r.variants.map((v, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-[5px] rounded-lg text-[12px] font-semibold text-white tracking-[0.02em]"
                    style={{
                      fontFamily: "var(--font-mono)",
                      background: "rgba(0,0,0,0.5)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {v}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-[12px] tracking-[0.02em]" style={{ color: "rgba(255,255,255,0.5)" }}>
                Gaji minimum{" "}
                <strong
                  style={{ fontFamily: "var(--font-mono)", color: "var(--lc-fail)", fontWeight: 700, marginLeft: 4 }}
                >
                  RM{formatRM(r.min)}
                </strong>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
