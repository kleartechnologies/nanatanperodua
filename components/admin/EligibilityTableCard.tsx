"use client";

import type { CarModel } from "@/lib/types";

interface Props {
  rows: CarModel[];
  onChange: (rows: CarModel[]) => void;
}

export function EligibilityTableCard({ rows, onChange }: Props) {
  function updateRow(id: number, patch: Partial<CarModel>) {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function deleteRow(id: number) {
    onChange(rows.filter((r) => r.id !== id));
  }
  function addRow() {
    onChange([...rows, { id: Date.now(), model: "NEW", min: 1000, variants: ["—"] }]);
  }

  const cellStyle = {
    background: "rgba(0,0,0,0.25)",
    border: "1px solid var(--lc-line)",
    borderRadius: 8,
    padding: "9px 9px",
    color: "var(--lc-text)",
    fontSize: 12,
    fontFamily: "inherit",
    outline: "none",
    minWidth: 0,
    minHeight: 44,
  } as React.CSSProperties;

  return (
    <section
      className="rounded-[22px] border backdrop-blur-sm pb-3.5"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0)), rgba(255,255,255,0.012)",
        borderColor: "var(--lc-line)",
        padding: "16px 16px 14px",
      }}
    >
      <div className="flex items-baseline justify-between mb-3.5">
        <div className="text-[13px] font-semibold tracking-[0.02em]">Eligibility table</div>
        <div className="text-[11px]" style={{ color: "var(--lc-text-dim)" }}>{rows.length} models</div>
      </div>

      {/* Horizontally scrollable on very narrow screens */}
      <div className="lc-table-scroll flex flex-col gap-1">
        <div className="lc-table-min flex flex-col gap-1">
        {/* Header */}
        <div
          className="grid gap-1.5 px-1 pb-1.5 text-[10px] uppercase tracking-[0.08em]"
          style={{ gridTemplateColumns: "64px 1fr 70px 32px", color: "var(--lc-text-dim)" }}
        >
          <span>Model</span>
          <span>Variants</span>
          <span>Min RM</span>
          <span />
        </div>

        {rows.map((r) => (
          <div
            key={r.id}
            className="grid gap-1.5 items-center"
            style={{ gridTemplateColumns: "64px 1fr 70px 32px" }}
          >
            <input
              style={{ ...cellStyle, fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "0.02em" }}
              value={r.model}
              onChange={(e) => updateRow(r.id, { model: e.target.value.toUpperCase() })}
              onFocus={(e) => (e.target.style.borderColor = "var(--lc-accent-soft)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--lc-line)")}
            />
            <input
              style={cellStyle}
              value={r.variants.join(", ")}
              onChange={(e) =>
                updateRow(r.id, {
                  variants: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                })
              }
              onFocus={(e) => (e.target.style.borderColor = "var(--lc-accent-soft)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--lc-line)")}
            />
            <input
              type="number"
              style={{ ...cellStyle, fontVariantNumeric: "tabular-nums", textAlign: "right" }}
              value={r.min}
              onChange={(e) => updateRow(r.id, { min: +e.target.value || 0 })}
              onFocus={(e) => (e.target.style.borderColor = "var(--lc-accent-soft)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--lc-line)")}
            />
            <button
              className="flex items-center justify-center p-0 rounded-lg transition-colors"
              style={{
                width: 32,
                height: 44,
                background: "transparent",
                border: "1px solid var(--lc-line)",
                color: "var(--lc-text-dim)",
              }}
              onClick={() => deleteRow(r.id)}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "var(--lc-fail)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "color-mix(in oklab, var(--lc-fail) 40%, transparent)";
                (e.currentTarget as HTMLButtonElement).style.background = "color-mix(in oklab, var(--lc-fail) 8%, transparent)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "var(--lc-text-dim)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--lc-line)";
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
              aria-label="Delete row"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
              </svg>
            </button>
          </div>
        ))}
        </div>{/* lc-table-min */}
      </div>{/* lc-table-scroll */}

      <button
        className="lc-touch mt-2.5 w-full rounded-[10px] py-[9px] text-[12px] transition-colors"
        style={{
          background: "transparent",
          border: "1px dashed var(--lc-line-strong)",
          color: "var(--lc-text-mute)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--lc-accent-soft)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--lc-text)";
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.02)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--lc-line-strong)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--lc-text-mute)";
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        }}
        onClick={addRow}
      >
        <span style={{ color: "var(--lc-accent)", fontWeight: 700, marginRight: 4 }}>+</span>
        Add model
      </button>
    </section>
  );
}
