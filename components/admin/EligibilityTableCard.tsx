"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CarModel } from "@/lib/types";

// ── Shared grid template ─────────────────────────────────────────
const GRID = "22px 60px 1fr 68px 32px";

// ── Drag handle icon (2 × 3 dots) ───────────────────────────────
function GripIcon() {
  return (
    <svg width="9" height="13" viewBox="0 0 9 13" fill="currentColor" aria-hidden>
      <circle cx="2.5" cy="2"    r="1.3" />
      <circle cx="6.5" cy="2"    r="1.3" />
      <circle cx="2.5" cy="6.5"  r="1.3" />
      <circle cx="6.5" cy="6.5"  r="1.3" />
      <circle cx="2.5" cy="11"   r="1.3" />
      <circle cx="6.5" cy="11"   r="1.3" />
    </svg>
  );
}

// ── Shared cell style ────────────────────────────────────────────
const CELL: React.CSSProperties = {
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
};

// ── Drag overlay — slim pill showing the model name ───────────────
function RowOverlay({ row }: { row: CarModel }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: GRID,
        gap: 6,
        alignItems: "center",
        background: "rgba(8,12,18,0.97)",
        border: "1px solid var(--lc-accent-soft)",
        borderRadius: 10,
        padding: "2px 6px 2px 2px",
        boxShadow: "0 14px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)",
      }}
    >
      <div className="lc-drag-handle flex items-center justify-center" style={{ width: 22, height: 44, color: "var(--lc-accent)" }}>
        <GripIcon />
      </div>
      <div style={{ ...CELL, display: "flex", alignItems: "center", fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "0.02em" }}>
        {row.model}
      </div>
      <div style={{ ...CELL, display: "flex", alignItems: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {row.variants.join(", ")}
      </div>
      <div style={{ ...CELL, display: "flex", alignItems: "center", justifyContent: "flex-end", fontVariantNumeric: "tabular-nums" }}>
        {row.min.toLocaleString()}
      </div>
      <div style={{ width: 32 }} />
    </div>
  );
}

// ── Single sortable row ──────────────────────────────────────────
interface SortableRowProps {
  row: CarModel;
  onUpdate: (patch: Partial<CarModel>) => void;
  onDelete: () => void;
}

function SortableRow({ row, onUpdate, onDelete }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        display: "grid",
        gridTemplateColumns: GRID,
        gap: 6,
        alignItems: "center",
      }}
    >
      {/* Drag handle */}
      <button
        className="lc-drag-handle flex items-center justify-center"
        style={{ width: 22, height: 44, background: "transparent", border: 0, padding: 0, flexShrink: 0, touchAction: "none" }}
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripIcon />
      </button>

      {/* Model */}
      <input
        style={{ ...CELL, fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "0.02em" }}
        value={row.model}
        onChange={(e) => onUpdate({ model: e.target.value.toUpperCase() })}
        onFocus={(e) => (e.target.style.borderColor = "var(--lc-accent-soft)")}
        onBlur={(e)  => (e.target.style.borderColor = "var(--lc-line)")}
      />

      {/* Variants */}
      <input
        style={CELL}
        value={row.variants.join(", ")}
        onChange={(e) => onUpdate({ variants: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
        onFocus={(e) => (e.target.style.borderColor = "var(--lc-accent-soft)")}
        onBlur={(e)  => (e.target.style.borderColor = "var(--lc-line)")}
      />

      {/* Min salary */}
      <input
        type="number"
        style={{ ...CELL, fontVariantNumeric: "tabular-nums", textAlign: "right" }}
        value={row.min}
        onChange={(e) => onUpdate({ min: +e.target.value || 0 })}
        onFocus={(e) => (e.target.style.borderColor = "var(--lc-accent-soft)")}
        onBlur={(e)  => (e.target.style.borderColor = "var(--lc-line)")}
      />

      {/* Delete */}
      <button
        className="flex items-center justify-center p-0 rounded-lg"
        style={{ width: 32, height: 44, background: "transparent", border: "1px solid var(--lc-line)", color: "var(--lc-text-dim)" }}
        onClick={onDelete}
        onMouseEnter={(e) => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.color = "var(--lc-fail)";
          b.style.borderColor = "color-mix(in oklab, var(--lc-fail) 40%, transparent)";
          b.style.background  = "color-mix(in oklab, var(--lc-fail) 8%, transparent)";
        }}
        onMouseLeave={(e) => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.color = "var(--lc-text-dim)";
          b.style.borderColor = "var(--lc-line)";
          b.style.background  = "transparent";
        }}
        aria-label="Delete row"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
        </svg>
      </button>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────

interface Props {
  rows: CarModel[];
  onChange: (rows: CarModel[]) => void;
  syncOrder: boolean;
  onSyncToggle: () => void;
}

export function EligibilityTableCard({ rows, onChange, syncOrder, onSyncToggle }: Props) {
  const [activeId, setActiveId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeRow = rows.find(r => r.id === activeId) ?? null;

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as number);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (over && active.id !== over.id) {
      const oldIdx = rows.findIndex(r => r.id === active.id);
      const newIdx = rows.findIndex(r => r.id === over.id);
      onChange(arrayMove(rows, oldIdx, newIdx));
    }
  }

  return (
    <section
      className="rounded-[22px] border backdrop-blur-sm"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0)), rgba(255,255,255,0.012)",
        borderColor: "var(--lc-line)",
        padding: "16px 16px 14px",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="text-[13px] font-semibold tracking-[0.02em]">Eligibility table</div>

        <div className="flex items-center gap-3">
          <span className="text-[11px]" style={{ color: "var(--lc-text-dim)" }}>
            {rows.length} models
          </span>

          {/* Sync live display order toggle */}
          <label
            className="flex items-center gap-1.5 cursor-pointer select-none"
            title={syncOrder ? "Live display follows table order — click to make it independent" : "Live display has independent order — click to sync with table"}
          >
            <button
              style={{
                width: 28, height: 16, borderRadius: 999,
                background: syncOrder ? "var(--lc-accent)" : "rgba(255,255,255,0.1)",
                border: 0, padding: 0, cursor: "pointer",
                position: "relative", flexShrink: 0,
                transition: "background 0.2s",
              }}
              onClick={onSyncToggle}
            >
              <span style={{
                position: "absolute", top: 2, left: 2,
                width: 12, height: 12, borderRadius: "50%",
                background: "white",
                transition: "transform 0.2s",
                transform: syncOrder ? "translateX(12px)" : "none",
                display: "block",
              }} />
            </button>
            <span style={{ fontSize: 10, color: "var(--lc-text-dim)", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
              Sync live
            </span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="lc-table-scroll">
        <div className="lc-table-min flex flex-col gap-1">

          {/* Column headers */}
          <div
            className="grid gap-1.5 pb-1.5 text-[10px] uppercase tracking-[0.08em]"
            style={{ gridTemplateColumns: GRID, color: "var(--lc-text-dim)", paddingLeft: 2 }}
          >
            <span />
            <span>Model</span>
            <span>Variants</span>
            <span style={{ textAlign: "right" }}>Min RM</span>
            <span />
          </div>

          {/* Sortable rows */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={rows.map(r => r.id)} strategy={verticalListSortingStrategy}>
              {rows.map(r => (
                <SortableRow
                  key={r.id}
                  row={r}
                  onUpdate={(patch) => onChange(rows.map(x => x.id === r.id ? { ...x, ...patch } : x))}
                  onDelete={() => onChange(rows.filter(x => x.id !== r.id))}
                />
              ))}
            </SortableContext>

            <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.25,1,0.5,1)" }}>
              {activeRow ? <RowOverlay row={activeRow} /> : null}
            </DragOverlay>
          </DndContext>

        </div>
      </div>

      {/* Add row */}
      <button
        className="lc-touch mt-2.5 w-full rounded-[10px] py-[9px] text-[12px] transition-colors"
        style={{ background: "transparent", border: "1px dashed var(--lc-line-strong)", color: "var(--lc-text-mute)" }}
        onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = "var(--lc-accent-soft)"; b.style.color = "var(--lc-text)"; b.style.background = "rgba(255,255,255,0.02)"; }}
        onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = "var(--lc-line-strong)"; b.style.color = "var(--lc-text-mute)"; b.style.background = "transparent"; }}
        onClick={() => onChange([...rows, { id: Date.now(), model: "NEW", min: 1000, variants: ["—"] }])}
      >
        <span style={{ color: "var(--lc-accent)", fontWeight: 700, marginRight: 4 }}>+</span>
        Add model
      </button>
    </section>
  );
}
