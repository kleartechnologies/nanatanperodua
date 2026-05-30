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
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  onReorder?: (newIds: number[]) => void;
}

// ── Drag handle icon (same 2×3 dots as table) ────────────────────
function GripIcon() {
  return (
    <svg width="9" height="13" viewBox="0 0 9 13" fill="currentColor" aria-hidden>
      <circle cx="2.5" cy="2"   r="1.3" />
      <circle cx="6.5" cy="2"   r="1.3" />
      <circle cx="2.5" cy="6.5" r="1.3" />
      <circle cx="6.5" cy="6.5" r="1.3" />
      <circle cx="2.5" cy="11"  r="1.3" />
      <circle cx="6.5" cy="11"  r="1.3" />
    </svg>
  );
}

// ── Pure visual card ─────────────────────────────────────────────
function CardFace({ row, accent, displayMode }: {
  row: EvaluatedRow;
  accent: string;
  displayMode: "glow" | "flat";
}) {
  const passBorder = `color-mix(in oklab, ${accent} 35%, transparent)`;
  const failBorder = "color-mix(in oklab, var(--lc-fail) 30%, transparent)";
  const passGlow   = `0 16px 40px rgba(0,0,0,0.4), 0 0 30px color-mix(in oklab, ${accent} 18%, transparent), inset 0 1px 0 rgba(255,255,255,0.06)`;
  const failGlow   = "0 16px 40px rgba(0,0,0,0.4), 0 0 26px color-mix(in oklab, var(--lc-fail) 14%, transparent), inset 0 1px 0 rgba(255,255,255,0.04)";

  return (
    <div
      className="relative rounded-[18px] flex flex-col justify-between gap-2.5 overflow-hidden"
      style={{
        padding: "16px 18px",
        minWidth: 0,
        height: "100%",
        backdropFilter: displayMode === "flat" ? "blur(10px)" : "blur(18px) saturate(1.15)",
        border: `1px solid ${row.eligible ? passBorder : failBorder}`,
        background: row.eligible
          ? `linear-gradient(180deg, color-mix(in oklab, ${accent} 10%, transparent), rgba(0,0,0,0.05)), rgba(10,18,14,0.9)`
          : "linear-gradient(180deg, color-mix(in oklab, var(--lc-fail) 8%, transparent), rgba(0,0,0,0.05)), rgba(18,12,12,0.9)",
        boxShadow: displayMode === "glow"
          ? row.eligible ? passGlow : failGlow
          : "none",
      }}
    >
      {/* Drag hint — shown on hover via CSS class */}
      <div className="lc-drag-hint absolute top-2 right-2 pointer-events-none z-10"
           style={{ color: row.eligible ? accent : "var(--lc-fail)" }}>
        <GripIcon />
      </div>

      {/* Head */}
      <div className="flex items-center justify-between gap-2.5 relative z-[1]">
        <div
          className="font-extrabold tracking-[0.03em] text-white"
          style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px, 1.9vw, 30px)" }}
        >
          {row.model}
        </div>
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-[12px] tracking-[0.12em] flex-shrink-0"
          style={{
            fontFamily: "var(--font-display)",
            background: row.eligible ? accent : "rgba(0,0,0,0.5)",
            color: row.eligible ? "#001005" : "var(--lc-fail)",
            border: row.eligible ? "none" : `1px solid color-mix(in oklab, var(--lc-fail) 50%, transparent)`,
            boxShadow: row.eligible ? `0 0 14px color-mix(in oklab, ${accent} 50%, transparent)` : "none",
          }}
        >
          {row.eligible ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4 10-10" /></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" /></svg>
          )}
          {row.eligible ? "LULUS" : "GAGAL"}
        </div>
      </div>

      {/* Body */}
      <div className="relative z-[1] min-h-9 flex items-start">
        {row.eligible ? (
          <div className="flex flex-wrap gap-1.5">
            {row.variants.map((v, i) => (
              <span key={i} className="px-2.5 py-[5px] rounded-lg text-[12px] font-semibold text-white tracking-[0.02em]"
                style={{ fontFamily: "var(--font-mono)", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {v}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-[12px] tracking-[0.02em]" style={{ color: "rgba(255,255,255,0.5)" }}>
            Gaji minimum{" "}
            <strong style={{ fontFamily: "var(--font-mono)", color: "var(--lc-fail)", fontWeight: 700, marginLeft: 4 }}>
              RM{formatRM(row.min)}
            </strong>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sortable card wrapper ────────────────────────────────────────
function SortableCard({ row, accent, displayMode, disabled }: {
  row: EvaluatedRow;
  accent: string;
  displayMode: "glow" | "flat";
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
    disabled,
  });

  return (
    /*
     * Outer div: only dnd-kit positioning transform — no scale/visual.
     * Inner CardFace wrapper: visual lift (scale, shadow) separate from
     * positional transform so grab-point offset is never altered.
     */
    <div
      ref={setNodeRef}
      className="lc-sortable-card"
      data-drag-disabled={disabled}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? "none" : (transition ?? undefined),
        zIndex: isDragging ? 50 : undefined,
        position: "relative",
        willChange: isDragging ? "transform" : undefined,
        minHeight: 0,
        cursor: disabled ? "default" : isDragging ? "grabbing" : "grab",
        touchAction: disabled ? undefined : "none",
      }}
      {...(disabled ? {} : { ...attributes, ...listeners })}
    >
      {/* Visual wrapper — scale lifts independently from the position transform */}
      <div
        style={{
          transform: isDragging ? "scale(1.04)" : "scale(1)",
          transition: "transform 0.12s ease, box-shadow 0.12s ease",
          boxShadow: isDragging
            ? "0 20px 60px rgba(0,0,0,0.75), 0 4px 20px rgba(0,0,0,0.5)"
            : undefined,
          borderRadius: 18,
          height: "100%",
        }}
      >
        <CardFace row={row} accent={accent} displayMode={displayMode} />
      </div>
    </div>
  );
}

// ── ResultGrid ───────────────────────────────────────────────────
export function ResultGrid({ rows, displayMode, accent, fullscreen, onReorder }: Props) {
  const dragEnabled = !fullscreen && !!onReorder;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (over && active.id !== over.id) {
      const oldIdx = rows.findIndex(r => r.id === active.id);
      const newIdx = rows.findIndex(r => r.id === over.id);
      onReorder?.(arrayMove(rows, oldIdx, newIdx).map(r => r.id));
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={rows.map(r => r.id)} strategy={rectSortingStrategy}>
        <div className={fullscreen ? "lc-result-grid lc-result-grid-fs" : "lc-result-grid"}>
          {rows.map(r => (
            <SortableCard
              key={r.id}
              row={r}
              accent={accent}
              displayMode={displayMode}
              disabled={!dragEnabled}
            />
          ))}
        </div>
      </SortableContext>
      {/* No DragOverlay — card element itself moves with the cursor via transform.
          DragOverlay caused an offset because its rendered width (fixed 220px)
          differed from the auto-fill grid cell width, shifting the grab point. */}
    </DndContext>
  );
}
