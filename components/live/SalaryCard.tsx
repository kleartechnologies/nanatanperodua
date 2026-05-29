"use client";

import { useState } from "react";
import { formatRM } from "@/lib/utils";

interface Props {
  salary: number;
  onSalaryChange: (v: number) => void;
  passCount: number;
  failCount: number;
  accent: string;
}

export function SalaryCard({ salary, onSalaryChange, passCount, failCount, accent }: Props) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="relative w-full flex justify-center" style={{ maxWidth: 680 }}>
      {/* Halo */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: "50%", top: "50%",
          width: "140%", height: "260%",
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(ellipse 50% 40% at 50% 50%, color-mix(in oklab, ${accent} 22%, transparent), transparent 65%)`,
          filter: "blur(40px)",
          mixBlendMode: "screen",
          zIndex: 0,
        }}
      />

      {/* Card */}
      <div
        className="lc-salary-card relative w-full rounded-3xl text-center overflow-hidden z-[1]"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01)), rgba(10,14,18,0.88)",
          border: "1px solid var(--lc-line-strong)",
          padding: "clamp(12px, 3vw, 18px) clamp(14px, 4vw, 28px) 14px",
          backdropFilter: "blur(24px) saturate(1.2)",
          boxShadow: `0 24px 60px rgba(0,0,0,0.5), 0 0 80px color-mix(in oklab, ${accent} 10%, transparent), inset 0 1px 0 rgba(255,255,255,0.08)`,
        }}
      >
        {/* Corner accents */}
        {(["tl", "tr", "bl", "br"] as const).map((pos) => (
          <div
            key={pos}
            className="absolute"
            style={{
              width: 18, height: 18,
              border: `2px solid ${accent}`,
              opacity: 0.7,
              top: pos.startsWith("t") ? 10 : undefined,
              bottom: pos.startsWith("b") ? 10 : undefined,
              left: pos.endsWith("l") ? 10 : undefined,
              right: pos.endsWith("r") ? 10 : undefined,
              borderRight: pos.endsWith("r") || pos === "tl" || pos === "bl" ? (pos.endsWith("r") ? "2px solid" : "0") : "0",
              borderLeft: pos.endsWith("l") ? "2px solid" : "0",
              borderTop: pos.startsWith("t") ? "2px solid" : "0",
              borderBottom: pos.startsWith("b") ? "2px solid" : "0",
              borderRadius:
                pos === "tl" ? "4px 0 0 0" :
                pos === "tr" ? "0 4px 0 0" :
                pos === "bl" ? "0 0 0 4px" : "0 0 4px 0",
              borderColor: accent,
            }}
          />
        ))}

        <div
          className="text-[11px] uppercase tracking-[0.22em] mb-2"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          Gaji bersih bulanan
        </div>

        <div className="flex items-baseline justify-center gap-3 mb-3">
          <span
            className="font-semibold tracking-[0.04em]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(18px, 3.5vw, 28px)",
              color: accent,
            }}
          >
            RM
          </span>
          {editing ? (
            <input
              className="lc-salary-input"
              type="number"
              autoFocus
              value={salary}
              onChange={(e) => onSalaryChange(+e.target.value || 0)}
              onBlur={() => setEditing(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
            />
          ) : (
            <button className="lc-salary-display" onClick={() => setEditing(true)}>
              {formatRM(salary)}
            </button>
          )}
        </div>

        <div
          className="flex items-center justify-center gap-6 pt-2.5"
          style={{ borderTop: "1px solid var(--lc-line)" }}
        >
          <div className="flex flex-col items-center gap-0.5">
            <div
              className="font-extrabold tracking-tight leading-none"
              style={{ fontFamily: "var(--font-display)", fontSize: 22, color: accent }}
            >
              {passCount}
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>
              LULUS
            </div>
          </div>
          <div className="w-px h-[30px]" style={{ background: "var(--lc-line-strong)" }} />
          <div className="flex flex-col items-center gap-0.5">
            <div
              className="font-extrabold tracking-tight leading-none"
              style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--lc-fail)" }}
            >
              {failCount}
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>
              GAGAL
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
