"use client";

import { useRef } from "react";
import { readImageFile } from "@/lib/utils";

interface BrandingCardProps {
  logo: string | null;
  bg: string | null;
  advisorPhoto: string | null;
  onLogoChange: (v: string | null) => void;
  onBgChange: (v: string | null) => void;
  onAdvisorPhotoChange: (v: string | null) => void;
}

interface UploadSlotProps {
  label: string;
  hint: string;
  image: string | null;
  placeholder: string;
  striped?: boolean;
  onFile: (file: File) => void;
}

function UploadSlot({ label, hint, image, placeholder, striped, onFile }: UploadSlotProps) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div
      className="flex flex-col gap-2 p-2.5 rounded-[14px] border border-dashed cursor-pointer transition-colors"
      style={{ borderColor: "var(--lc-line-strong)", background: "rgba(0,0,0,0.2)" }}
      onClick={() => ref.current?.click()}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--lc-accent-soft)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--lc-line-strong)")}
    >
      <div
        className="rounded-lg overflow-hidden flex items-center justify-center"
        style={{ aspectRatio: "16/9", background: "rgba(0,0,0,0.4)" }}
      >
        {image ? (
          <img src={image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div
            className="text-[10px] font-semibold tracking-[0.16em] flex items-center justify-center w-full h-full"
            style={{
              color: "var(--lc-text-dim)",
              background: striped
                ? "repeating-linear-gradient(135deg, rgba(255,255,255,0.025) 0 6px, rgba(255,255,255,0) 6px 12px)"
                : undefined,
            }}
          >
            {placeholder}
          </div>
        )}
      </div>
      <div>
        <div className="text-[12px] font-medium" style={{ color: "var(--lc-text)" }}>{label}</div>
        <div className="text-[10px] mt-0.5" style={{ color: "var(--lc-text-dim)" }}>{hint}</div>
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function BrandingCard({ logo, bg, advisorPhoto, onLogoChange, onBgChange, onAdvisorPhotoChange }: BrandingCardProps) {
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

      <div className="grid grid-cols-2 gap-2.5">
        <UploadSlot
          label="Company logo"
          hint="PNG · transparent"
          placeholder="LOGO"
          image={logo}
          onFile={async (f) => onLogoChange(await readImageFile(f))}
        />
        <UploadSlot
          label="Background"
          hint="JPG · 1920×1080"
          placeholder="BACKDROP"
          striped
          image={bg}
          onFile={async (f) => onBgChange(await readImageFile(f))}
        />
        <UploadSlot
          label="Advisor photo"
          hint="JPG · portrait"
          placeholder="PHOTO"
          image={advisorPhoto}
          onFile={async (f) => onAdvisorPhotoChange(await readImageFile(f))}
        />
      </div>
    </section>
  );
}
