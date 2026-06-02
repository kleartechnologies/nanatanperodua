"use client";

import type { TweakSettings, CarModel } from "@/lib/types";
import { withAlpha } from "@/lib/utils";
import { BrandingCard } from "./BrandingCard";
import { DisplayCopyCard } from "./DisplayCopyCard";
import { ThemeCard } from "./ThemeCard";
import { DisplaySettingsCard } from "./DisplaySettingsCard";
import { EligibilityTableCard } from "./EligibilityTableCard";

interface Props {
  tweaks: TweakSettings;
  setTweak: <K extends keyof TweakSettings>(key: K, value: TweakSettings[K]) => void;
  rows: CarModel[];
  setRows: (rows: CarModel[]) => void;
  logo: string | null;
  setLogo: (v: string | null) => void;
  bg: string | null;
  setBg: (v: string | null) => void;
  onGoLive: () => void;
  showHeader?: boolean;
  syncOrder: boolean;
  onSyncToggle: () => void;
}

export function AdminPanel({
  tweaks, setTweak,
  rows, setRows,
  logo, setLogo,
  bg, setBg,
  onGoLive,
  showHeader = true,
  syncOrder,
  onSyncToggle,
}: Props) {
  return (
    <aside
      className="flex flex-col h-full border-r"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0) 30%), var(--lc-bg-1)",
        borderColor: "var(--lc-line)",
        width: "100%",
      }}
    >
      {/* Header — hidden on mobile tab layout (tab bar replaces it) */}
      {showHeader && (
        <div
          className="flex items-center justify-between px-[22px] py-[18px] flex-shrink-0 border-b"
          style={{ borderColor: "var(--lc-line)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-[22px] h-[22px] rounded-[7px]"
              style={{
                background: tweaks.accent,
                boxShadow: `0 0 18px ${withAlpha(tweaks.accent, 0.30)}, inset 0 0 0 1px rgba(0,0,0,0.3)`,
              }}
            />
            <div>
              <div
                className="text-[17px] font-bold tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                LiveCheck<span style={{ color: tweaks.accent }}>.</span>
              </div>
              <div
                className="text-[11px] uppercase tracking-[0.06em] mt-0.5"
                style={{ color: "var(--lc-text-mute)" }}
              >
                Sales Advisor Console
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div className="lc-admin-scroll overflow-y-auto overflow-x-hidden p-[18px] flex flex-col gap-3.5 flex-1 min-h-0">
        <BrandingCard
          logo={logo}
          bg={bg}
          onLogoChange={setLogo}
          onBgChange={setBg}
        />
        <DisplayCopyCard tweaks={tweaks} onChange={setTweak} />
        <ThemeCard accent={tweaks.accent} onChange={(c) => setTweak("accent", c)} />
        <DisplaySettingsCard
          displayMode={tweaks.displayMode}
          bgBlur={tweaks.bgBlur}
          onChange={setTweak}
        />
        <EligibilityTableCard
          rows={rows}
          onChange={setRows}
          syncOrder={syncOrder}
          onSyncToggle={onSyncToggle}
        />

        <button
          className="lc-touch flex items-center justify-center gap-2.5 py-3.5 rounded-[14px] font-bold text-[13px] tracking-[0.02em] transition-all"
          style={{
            background: tweaks.accent,
            color: "#001005",
            border: 0,
            boxShadow: `0 8px 30px ${withAlpha(tweaks.accent, 0.35)}, inset 0 1px 0 rgba(255,255,255,0.4)`,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 12px 36px ${withAlpha(tweaks.accent, 0.50)}, inset 0 1px 0 rgba(255,255,255,0.4)`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 30px color-mix(in oklab, ${tweaks.accent} 35%, transparent), inset 0 1px 0 rgba(255,255,255,0.4)`;
          }}
          onClick={onGoLive}
        >
          Fullscreen LIVE display
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3h7v2H5v5H3V3zm18 0v7h-2V5h-5V3h7zM3 14h2v5h5v2H3v-7zm16 5h-5v2h7v-7h-2v5z" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
