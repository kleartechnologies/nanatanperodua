"use client";

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
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

// Column layout: handle | model | variants | min | delete
const GRID = "32px 60px 1fr 68px 32px";

function GripIcon() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden>
      <circle cx="3" cy="2"  r="1.4" />
      <circle cx="7" cy="2"  r="1.4" />
      <circle cx="3" cy="7"  r="1.4" />
      <circle cx="7" cy="7"  r="1.4" />
      <circle cx="3" cy="12" r="1.4" />
      <circle cx="7" cy="12" r="1.4" />
    </svg>
  );
}

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

// ── Sortable row ─────────────────────────────────────────────────
interface SortableRowProps {
  row: CarModel;
  onUpdate: (patch: Partial<CarModel>) => void;
  onDelete: () => void;
}

function SortableRow({ row, onUpdate, onDelete }: SortableRowProps) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: row.id });

  return (
    /*
     * Outer div: handles dnd-kit's translate transform only.
     * No layout properties here so the transform origin stays
     * exactly where dnd-kit expects it (top-left of the element).
     */
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        // Disable transition during active drag for instant response;
        // re-enable for the drop snap-back animation.
        transition: isDragging ? "none" : (transition ?? undefined),
        zIndex: isDragging ? 50 : undefined,
        position: "relative",
        willChange: isDragging ? "transform" : undefined,
      }}
    >
      {/*
       * Inner div: owns the grid layout + all visual lift styles.
       * Separating visual transform (scale) from positional transform
       * prevents scale from altering the grab-point offset.
       */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: GRID,
          gap: 6,
          alignItems: "center",
          borderRadius: 10,
          transition: "transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease, background 0.12s ease",
          transform: isDragging ? "scale(1.025)" : "scale(1)",
          background: isDragging ? "rgba(6,10,16,0.97)" : "transparent",
          border: isDragging
            ? "1px solid color-mix(in oklab, var(--lc-accent) 35%, transparent)"
            : "1px solid transparent",
          boxShadow: isDragging
            ? "0 10px 36px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.05)"
            : "none",
          cursor: isDragging ? "grabbing" : "default",
        }}
      >
        {/* ── Drag handle ── */}
        <button
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          style={{
            width: 32,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: 0,
            padding: 0,
            flexShrink: 0,
            touchAction: "none",
            cursor: isDragging ? "grabbing" : "grab",
            color: isDragging ? "var(--lc-accent)" : "var(--lc-text-dim)",
            transition: "color 0.12s",
            borderRadius: 6,
          }}
          onMouseEnter={(e) => {
            if (!isDragging) (e.currentTarget as HTMLButtonElement).style.color = "var(--lc-accent)";
          }}
          onMouseLeave={(e) => {
            if (!isDragging) (e.currentTarget as HTMLButtonElement).style.color = "var(--lc-text-dim)";
          }}
        >
          <GripIcon />
        </button>

        {/* ── Model ── */}
        <input
          style={{ ...CELL, fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "0.02em" }}
          value={row.model}
          onChange={(e) => onUpdate({ model: e.target.value.toUpperCase() })}
          onFocus={(e) => (e.target.style.borderColor = "var(--lc-accent-soft)")}
          onBlur={(e)  => (e.target.style.borderColor = "var(--lc-line)")}
        />

        {/* ── Variants ── */}
        <input
          style={CELL}
          value={row.variants.join(", ")}
          onChange={(e) => onUpdate({ variants: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
          onFocus={(e) => (e.target.style.borderColor = "var(--lc-accent-soft)")}
          onBlur={(e)  => (e.target.style.borderColor = "var(--lc-line)")}
        />

        {/* ── Min salary ── */}
        <input
          type="number"
          style={{ ...CELL, fontVariantNumeric: "tabular-nums", textAlign: "right" }}
          value={row.min}
          onChange={(e) => onUpdate({ min: +e.target.value || 0 })}
          onFocus={(e) => (e.target.style.borderColor = "var(--lc-accent-soft)")}
          onBlur={(e)  => (e.target.style.borderColor = "var(--lc-line)")}
        />

        {/* ── Delete ── */}
        <button
          style={{ width: 32, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid var(--lc-line)", borderRadius: 8, color: "var(--lc-text-dim)", cursor: "pointer", padding: 0 }}
          onClick={onDelete}
          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = "var(--lc-fail)"; b.style.borderColor = "color-mix(in oklab, var(--lc-fail) 40%, transparent)"; b.style.background = "color-mix(in oklab, var(--lc-fail) 8%, transparent)"; }}
          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = "var(--lc-text-dim)"; b.style.borderColor = "var(--lc-line)"; b.style.background = "transparent"; }}
          aria-label="Delete row"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
          </svg>
        </button>
      </div>
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
  const sensors = useSensors(
    // Mouse — activates after 5px movement so clicks still register
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    // Touch — delay prevents scroll/drag confusion on mobile
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    // Keyboard — for accessibility
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
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
          <span className="text-[11px]" style={{ color: "var(--lc-text-dim)" }}>{rows.length} models</span>

          {/* Sync live display toggle */}
          <label
            className="flex items-center gap-1.5 cursor-pointer select-none"
            title={syncOrder
              ? "Live display follows table order — click to make it independent"
              : "Live display has independent order — click to sync with table"}
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
                background: "white", display: "block",
                transition: "transform 0.2s",
                transform: syncOrder ? "translateX(12px)" : "none",
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

          {/* Column headers — must use same GRID template so columns align */}
          <div
            className="grid gap-1.5 pb-1.5 text-[10px] uppercase tracking-[0.08em]"
            style={{ gridTemplateColumns: GRID, color: "var(--lc-text-dim)" }}
          >
            <span />
            <span>Model</span>
            <span>Variants</span>
            <span style={{ textAlign: "right" }}>Min RM</span>
            <span />
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
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
            {/* No DragOverlay — the sortable item itself moves with the cursor.
                DragOverlay caused cursor-offset because the overlay renders in a
                portal without width constraints, producing a different bounding
                rect than the in-table row. */}
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
