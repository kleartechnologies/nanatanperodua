"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Panel,
  Group as PanelGroup,
  Separator,
  usePanelRef,
} from "react-resizable-panels";

import type { TweakSettings, CarModel } from "@/lib/types";
import { TWEAK_DEFAULTS, DEFAULT_ROWS, STORAGE_KEYS } from "@/lib/constants";
import { storageGet, storageSet } from "@/lib/utils";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { LivePreview } from "@/components/live/LivePreview";

export function DashboardClient() {
  const [mounted, setMounted] = useState(false);
  const [tweaks, setTweaksRaw] = useState<TweakSettings>(TWEAK_DEFAULTS);
  const [rows, setRowsRaw] = useState<CarModel[]>(DEFAULT_ROWS);
  const [logo, setLogoRaw] = useState<string | null>(null);
  const [bg, setBgRaw] = useState<string | null>(null);
  const [advisorPhoto, setAdvisorPhotoRaw] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  const adminPanelRef = usePanelRef();

  useEffect(() => {
    setTweaksRaw(storageGet<TweakSettings>(STORAGE_KEYS.TWEAKS, TWEAK_DEFAULTS));
    setRowsRaw(storageGet<CarModel[]>(STORAGE_KEYS.ROWS, DEFAULT_ROWS));
    setLogoRaw(storageGet<string | null>(STORAGE_KEYS.LOGO, null));
    setBgRaw(storageGet<string | null>(STORAGE_KEYS.BG, null));
    setAdvisorPhotoRaw(storageGet<string | null>(STORAGE_KEYS.ADVISOR_PHOTO, null));
    setMounted(true);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--lc-accent", tweaks.accent);
    document.documentElement.style.setProperty(
      "--lc-accent-soft",
      `color-mix(in oklab, ${tweaks.accent} 30%, transparent)`
    );
    document.documentElement.style.setProperty(
      "--lc-accent-dim",
      `color-mix(in oklab, ${tweaks.accent} 12%, transparent)`
    );
  }, [tweaks.accent]);

  const setTweak = useCallback(<K extends keyof TweakSettings>(key: K, value: TweakSettings[K]) => {
    setTweaksRaw((prev) => {
      const next = { ...prev, [key]: value };
      storageSet(STORAGE_KEYS.TWEAKS, next);
      return next;
    });
  }, []);

  const setRows = useCallback((next: CarModel[]) => {
    setRowsRaw(next);
    storageSet(STORAGE_KEYS.ROWS, next);
  }, []);

  const setLogo = useCallback((v: string | null) => {
    setLogoRaw(v);
    storageSet(STORAGE_KEYS.LOGO, v);
  }, []);

  const setBg = useCallback((v: string | null) => {
    setBgRaw(v);
    storageSet(STORAGE_KEYS.BG, v);
  }, []);

  const setAdvisorPhoto = useCallback((v: string | null) => {
    setAdvisorPhotoRaw(v);
    storageSet(STORAGE_KEYS.ADVISOR_PHOTO, v);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && fullscreen) setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  function handleCollapseToggle() {
    if (panelCollapsed) {
      adminPanelRef.current?.expand();
      setPanelCollapsed(false);
    } else {
      adminPanelRef.current?.collapse();
      setPanelCollapsed(true);
    }
  }

  if (!mounted) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: "#06080a" }}>
        <div className="text-[12px] tracking-[0.2em] uppercase" style={{ color: "#5a6373" }}>
          Loading…
        </div>
      </div>
    );
  }

  if (fullscreen) {
    return (
      <div className="h-screen w-screen overflow-hidden" style={{ background: "#06080a" }}>
        <LivePreview
          tweaks={tweaks}
          rows={rows}
          logo={logo}
          bg={bg}
          fullscreen={true}
          onExit={() => setFullscreen(false)}
        />
      </div>
    );
  }

  return (
    <div
      className="h-screen w-screen overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 30% 0%, #0e1318 0%, #06080a 60%)" }}
    >
      <PanelGroup orientation="horizontal" style={{ height: "100%", width: "100%", display: "flex" }}>
        <Panel
          panelRef={adminPanelRef}
          defaultSize={30}
          minSize={20}
          maxSize={55}
          collapsible
          collapsedSize={0}
          onResize={(size) => setPanelCollapsed(size.asPercentage === 0)}
        >
          <div style={{ height: "100%", overflow: "hidden" }}>
            <AdminPanel
              tweaks={tweaks}
              setTweak={setTweak}
              rows={rows}
              setRows={setRows}
              logo={logo}
              setLogo={setLogo}
              bg={bg}
              setBg={setBg}
              advisorPhoto={advisorPhoto}
              setAdvisorPhoto={setAdvisorPhoto}
              onGoLive={() => setFullscreen(true)}
            />
          </div>
        </Panel>

        <Separator style={{ position: "relative", width: 8, flexShrink: 0, cursor: "col-resize" }}>
          <ResizeDivider collapsed={panelCollapsed} onCollapse={handleCollapseToggle} />
        </Separator>

        <Panel minSize={30} style={{ flex: 1, minWidth: 0 }}>
          <LivePreview
            tweaks={tweaks}
            rows={rows}
            logo={logo}
            bg={bg}
            fullscreen={false}
            onExit={() => setFullscreen(false)}
          />
        </Panel>
      </PanelGroup>
    </div>
  );
}

function ResizeDivider({ collapsed, onCollapse }: { collapsed: boolean; onCollapse: () => void }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      className="relative flex items-center justify-center h-full"
      style={{ width: "100%", cursor: "col-resize" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        className="absolute top-0 bottom-0 w-px transition-all"
        style={{
          left: "50%",
          transform: "translateX(-50%)",
          background: hover ? "var(--lc-accent)" : "var(--lc-line)",
          boxShadow: hover ? "0 0 12px var(--lc-accent-soft)" : "none",
        }}
      />

      {hover && (
        <div
          className="relative flex flex-col gap-0.5 px-1 py-1.5 rounded-md"
          style={{
            background: "rgba(10,14,18,0.9)",
            border: "1px solid var(--lc-line-strong)",
            zIndex: 1,
          }}
        >
          {[0, 1, 2].map((i) => (
            <span key={i} className="block rounded-full" style={{ width: 2, height: 2, background: "var(--lc-accent)" }} />
          ))}
        </div>
      )}

      {hover && (
        <button
          className="absolute flex items-center justify-center rounded-full"
          style={{
            top: 18,
            left: "50%",
            transform: "translateX(-50%)",
            width: 22,
            height: 22,
            background: "var(--lc-bg-1)",
            border: "1px solid var(--lc-line-strong)",
            color: "var(--lc-text-mute)",
            zIndex: 2,
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onCollapse(); }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {collapsed ? <path d="M9 6l6 6-6 6" /> : <path d="M15 6l-6 6 6 6" />}
          </svg>
        </button>
      )}
    </div>
  );
}
