"use client";

import { useRef, useState } from "react";
import { readImageFile } from "@/lib/utils";

interface BrandingCardProps {
  logo: string | null;
  bg: string | null;
  onLogoChange: (v: string | null) => void;
  onBgChange: (v: string | null) => void;
}

// ── Shared action button styles ────────────────────────────────────

const btnBase: React.CSSProperties = {
  flex: 1,
  padding: "5px 0",
  borderRadius: 7,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.04em",
  cursor: "pointer",
  transition: "background 0.12s, border-color 0.12s, color 0.12s",
};

const btnDefault: React.CSSProperties = {
  ...btnBase,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid var(--lc-line-strong)",
  color: "var(--lc-text-mute)",
};

const btnAccent: React.CSSProperties = {
  ...btnBase,
  background: "var(--lc-accent)",
  border: "1px solid transparent",
  color: "#001005",
};

const btnDanger: React.CSSProperties = {
  ...btnBase,
  background: "transparent",
  border: "1px solid color-mix(in oklab, var(--lc-fail) 50%, transparent)",
  color: "var(--lc-fail)",
};

const btnDangerConfirm: React.CSSProperties = {
  ...btnBase,
  background: "color-mix(in oklab, var(--lc-fail) 15%, transparent)",
  border: "1px solid var(--lc-fail)",
  color: "var(--lc-fail)",
  fontWeight: 700,
};

const btnCancel: React.CSSProperties = {
  ...btnBase,
  flex: "none",
  padding: "5px 10px",
  background: "transparent",
  border: "1px solid var(--lc-line)",
  color: "var(--lc-text-dim)",
};

// ── Single image management slot ───────────────────────────────────

interface ImageSlotProps {
  label: string;
  hint: string;
  image: string | null;
  emptyLabel: string;
  striped?: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}

function ImageSlot({ label, hint, image, emptyLabel, striped, onUpload, onRemove }: ImageSlotProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  function triggerFile() {
    fileRef.current?.click();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = "";
  }

  return (
    <div
      className="flex flex-col gap-2 rounded-[14px] p-2.5"
      style={{ background: "rgba(0,0,0,0.25)", border: "1px solid var(--lc-line)" }}
    >
      {/* Preview */}
      <div
        className="w-full rounded-lg overflow-hidden flex items-center justify-center"
        style={{ aspectRatio: "16/9", background: "rgba(0,0,0,0.4)" }}
      >
        {image ? (
          <img src={image} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-1.5"
            style={{
              background: striped
                ? "repeating-linear-gradient(135deg, rgba(255,255,255,0.025) 0 6px, rgba(255,255,255,0) 6px 12px)"
                : undefined,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--lc-text-dim)" }}>
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <span
              className="text-[10px] font-semibold tracking-[0.14em] uppercase"
              style={{ color: "var(--lc-text-dim)" }}
            >
              {emptyLabel}
            </span>
          </div>
        )}
      </div>

      {/* Label row */}
      <div className="flex items-baseline justify-between px-0.5">
        <span className="text-[12px] font-medium" style={{ color: "var(--lc-text)" }}>{label}</span>
        <span className="text-[10px]" style={{ color: "var(--lc-text-dim)" }}>{hint}</span>
      </div>

      {/* Action bar */}
      {!confirmRemove ? (
        <div className="flex gap-1.5">
          {!image ? (
            /* No image: show Upload only */
            <button style={btnAccent} onClick={triggerFile}>
              Upload
            </button>
          ) : (
            /* Has image: Replace + Remove */
            <>
              <button style={btnDefault} onClick={triggerFile}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--lc-text)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.09)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--lc-text-mute)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
              >
                Replace
              </button>
              <button style={btnDanger} onClick={() => setConfirmRemove(true)}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "color-mix(in oklab, var(--lc-fail) 10%, transparent)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                Remove
              </button>
            </>
          )}
        </div>
      ) : (
        /* Confirm remove */
        <div className="flex gap-1.5 items-center">
          <span className="text-[10px] flex-1" style={{ color: "var(--lc-text-dim)" }}>
            Remove image?
          </span>
          <button
            style={btnDangerConfirm}
            onClick={() => { onRemove(); setConfirmRemove(false); }}
          >
            Yes, remove
          </button>
          <button style={btnCancel} onClick={() => setConfirmRemove(false)}>
            Cancel
          </button>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
    </div>
  );
}

// ── BrandingCard ───────────────────────────────────────────────────

export function BrandingCard({ logo, bg, onLogoChange, onBgChange }: BrandingCardProps) {
  return (
    <section
      className="rounded-[22px] p-4 border backdrop-blur-sm"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0)), rgba(255,255,255,0.012)",
        borderColor: "var(--lc-line)",
      }}
    >
      <div className="flex items-baseline justify-between mb-3.5">
        <div className="text-[13px] font-semibold tracking-[0.02em]">Branding</div>
        <div className="text-[11px]" style={{ color: "var(--lc-text-dim)" }}>Logo &amp; backdrop</div>
      </div>

      <div className="flex flex-col gap-3">
        <ImageSlot
          label="Company logo"
          hint="PNG · transparent"
          emptyLabel="No Logo Uploaded"
          image={logo}
          onUpload={async (f) => onLogoChange(await readImageFile(f))}
          onRemove={() => onLogoChange(null)}
        />
        <ImageSlot
          label="Background image"
          hint="JPG · 1920×1080"
          emptyLabel="No Background Uploaded"
          striped
          image={bg}
          onUpload={async (f) => onBgChange(await readImageFile(f))}
          onRemove={() => onBgChange(null)}
        />
      </div>
    </section>
  );
}
