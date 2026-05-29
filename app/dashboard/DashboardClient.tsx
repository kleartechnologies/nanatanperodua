"use client";

import { useState, useEffect, useCallback, useRef } from "react";

import type { TweakSettings, CarModel } from "@/lib/types";
import { TWEAK_DEFAULTS, DEFAULT_ROWS, STORAGE_KEYS } from "@/lib/constants";
import { storageGet, storageSet } from "@/lib/utils";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { LivePreview } from "@/components/live/LivePreview";

const MIN_W = 260;
const MAX_W_RATIO = 0.65;
const DEFAULT_W_RATIO = 0.30;

export function DashboardClient() {
  const [mounted, setMounted] = useState(false);
  const [tweaks, setTweaksRaw] = useState<TweakSettings>(TWEAK_DEFAULTS);
  const [rows, setRowsRaw] = useState<CarModel[]>(DEFAULT_ROWS);
  const [logo, setLogoRaw] = useState<string | null>(null);
  const [bg, setBgRaw] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  // Resize state
  const [adminWidth, setAdminWidth] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const isDragging = useRef(false);
  const lastExpandedWidth = useRef(0);

  // ── Hydrate from localStorage ────────────────────────────────────
  useEffect(() => {
    setTweaksRaw(storageGet<TweakSettings>(STORAGE_KEYS.TWEAKS, TWEAK_DEFAULTS));
    setRowsRaw(storageGet<CarModel[]>(STORAGE_KEYS.ROWS, DEFAULT_ROWS));
    setLogoRaw(storageGet<string | null>(STORAGE_KEYS.LOGO, null));
    setBgRaw(storageGet<string | null>(STORAGE_KEYS.BG, null));

    const saved = +localStorage.getItem("lc:adminWidth")!;
    const init = saved > MIN_W
      ? saved
      : Math.round(window.innerWidth * DEFAULT_W_RATIO);
    setAdminWidth(init);
    lastExpandedWidth.current = init;
    setMounted(true);
  }, []);

  // ── Persist width ────────────────────────────────────────────────
  useEffect(() => {
    if (adminWidth > 0 && !collapsed) {
      localStorage.setItem("lc:adminWidth", String(adminWidth));
    }
  }, [adminWidth, collapsed]);

  // ── Accent CSS vars ──────────────────────────────────────────────
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

  // ── Global drag listeners ────────────────────────────────────────
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isDragging.current) return;
      const maxW = Math.min(window.innerWidth * MAX_W_RATIO, 720);
      setAdminWidth(Math.max(MIN_W, Math.min(maxW, e.clientX)));
    }
    function onMouseUp() {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.classList.remove("is-resizing");
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // ── Keyboard escape ──────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && fullscreen) setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  // ── Persisted state setters ──────────────────────────────────────
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

  // ── Drag handlers ────────────────────────────────────────────────
  function startDrag(e: React.MouseEvent) {
    e.preventDefault();
    isDragging.current = true;
    document.body.classList.add("is-resizing");
  }

  function toggleCollapse() {
    if (collapsed) {
      setCollapsed(false);
      setAdminWidth(lastExpandedWidth.current || Math.round(window.innerWidth * DEFAULT_W_RATIO));
    } else {
      lastExpandedWidth.current = adminWidth;
      setCollapsed(true);
    }
  }

  // ── Render ───────────────────────────────────────────────────────
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

  const panelW = collapsed ? 0 : adminWidth;

  return (
    <div
      className="h-screen w-screen overflow-hidden flex"
      style={{ background: "radial-gradient(ellipse at 30% 0%, #0e1318 0%, #06080a 60%)" }}
    >
      {/* Admin panel */}
      <div
        style={{
          width: panelW,
          flexShrink: 0,
          overflow: "hidden",
          transition: isDragging.current ? "none" : "width 0.18s ease",
        }}
      >
        <AdminPanel
          tweaks={tweaks}
          setTweak={setTweak}
          rows={rows}
          setRows={setRows}
          logo={logo}
          setLogo={setLogo}
          bg={bg}
          setBg={setBg}
          onGoLive={() => setFullscreen(true)}
        />
      </div>

      {/* ── Drag divider ── */}
      <div
        className="lc-divider"
        onMouseDown={startDrag}
        onDoubleClick={() => {
          if (collapsed) toggleCollapse();
          else setAdminWidth(Math.round(window.innerWidth * DEFAULT_W_RATIO));
        }}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize admin panel"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setAdminWidth((w) => Math.max(MIN_W, w - 20));
          if (e.key === "ArrowRight") setAdminWidth((w) => Math.min(window.innerWidth * MAX_W_RATIO, w + 20));
        }}
      >
        <div className="lc-divider-line" />

        <div className="lc-divider-grip">
          <span /><span /><span />
        </div>

        <button
          className="lc-divider-collapse"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); toggleCollapse(); }}
          title={collapsed ? "Show admin panel" : "Hide admin panel"}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {collapsed
              ? <path d="M9 6l6 6-6 6" />
              : <path d="M15 6l-6 6 6 6" />}
          </svg>
        </button>
      </div>

      {/* Live preview */}
      <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
        <LivePreview
          tweaks={tweaks}
          rows={rows}
          logo={logo}
          bg={bg}
          fullscreen={false}
          onExit={() => setFullscreen(false)}
        />
      </div>
    </div>
  );
}
