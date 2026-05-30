"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";

import type { TweakSettings, CarModel } from "@/lib/types";
import { TWEAK_DEFAULTS, DEFAULT_ROWS, STORAGE_KEYS } from "@/lib/constants";
import { storageGet, storageSet } from "@/lib/utils";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { LivePreview } from "@/components/live/LivePreview";

const MIN_W = 260;
const MAX_W_RATIO = 0.65;
const DEFAULT_W_RATIO = 0.30;

// ── Icons ─────────────────────────────────────────────────────────

function IconFullscreen() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M3 3h7v2H5v5H3V3zm18 0v7h-2V5h-5V3h7zM3 14h2v5h5v2H3v-7zm16 5h-5v2h7v-7h-2v5z" />
    </svg>
  );
}

// ── Root client component ─────────────────────────────────────────

export function DashboardClient() {
  const [mounted, setMounted] = useState(false);

  // ── Content state ────────────────────────────────────────────────
  const [tweaks, setTweaksRaw] = useState<TweakSettings>(TWEAK_DEFAULTS);
  const [rows, setRowsRaw] = useState<CarModel[]>(DEFAULT_ROWS);
  const [logo, setLogoRaw] = useState<string | null>(null);
  const [bg, setBgRaw] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  // ── Drag-and-drop order state ────────────────────────────────────
  // syncOrder=true  → live display follows table row order
  // syncOrder=false → live display has independent card order (stored as id array)
  const [syncOrder, setSyncOrder] = useState(true);
  const [displayOrderIds, setDisplayOrderIds] = useState<number[]>([]);

  // ── Responsive layout state ──────────────────────────────────────
  const [isDesktop, setIsDesktop] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "preview">("preview");

  // ── Desktop resize state ─────────────────────────────────────────
  const [adminWidth, setAdminWidth] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const isDragging = useRef(false);
  const lastExpandedWidth = useRef(0);

  // ── Mount: hydrate + determine layout ───────────────────────────
  useEffect(() => {
    // Hydrate from localStorage
    setTweaksRaw(storageGet<TweakSettings>(STORAGE_KEYS.TWEAKS, TWEAK_DEFAULTS));
    setRowsRaw(storageGet<CarModel[]>(STORAGE_KEYS.ROWS, DEFAULT_ROWS));
    setLogoRaw(storageGet<string | null>(STORAGE_KEYS.LOGO, null));
    setBgRaw(storageGet<string | null>(STORAGE_KEYS.BG, null));
    setSyncOrder(storageGet<boolean>(STORAGE_KEYS.SYNC_ORDER, true));
    setDisplayOrderIds(storageGet<number[]>(STORAGE_KEYS.DISPLAY_ORDER, []));

    // Admin panel width
    const saved = +localStorage.getItem("lc:adminWidth")!;
    const init = saved > MIN_W ? saved : Math.round(window.innerWidth * DEFAULT_W_RATIO);
    setAdminWidth(init);
    lastExpandedWidth.current = init;

    // Breakpoint (batched with setMounted so there's no flash)
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);

    setMounted(true);

    // Listen for resize (e.g. tablet rotation)
    const handleMQ = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handleMQ);
    return () => mq.removeEventListener("change", handleMQ);
  }, []);

  // ── Persist admin width ──────────────────────────────────────────
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

  // ── Mouse drag ───────────────────────────────────────────────────
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

  // ── Touch drag (tablet landscape) ───────────────────────────────
  useEffect(() => {
    function onTouchMove(e: TouchEvent) {
      if (!isDragging.current || !e.touches[0]) return;
      e.preventDefault();
      const maxW = Math.min(window.innerWidth * MAX_W_RATIO, 720);
      setAdminWidth(Math.max(MIN_W, Math.min(maxW, e.touches[0].clientX)));
    }
    function onTouchEnd() {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.classList.remove("is-resizing");
    }
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
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

  // ── Persisted setters ────────────────────────────────────────────
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

  // ── Display order (live cards) ───────────────────────────────────

  // Rows in live-display order (respects independent sort when sync is OFF)
  const displayRows = useMemo<CarModel[]>(() => {
    if (syncOrder || displayOrderIds.length === 0) return rows;
    const map = new Map(rows.map(r => [r.id, r]));
    const ordered = displayOrderIds
      .map(id => map.get(id))
      .filter((r): r is CarModel => r !== undefined);
    // Append newly added rows not yet in displayOrderIds
    const knownIds = new Set(displayOrderIds);
    const newRows = rows.filter(r => !knownIds.has(r.id));
    return [...ordered, ...newRows];
  }, [rows, displayOrderIds, syncOrder]);

  const onDisplayReorder = useCallback((newIds: number[]) => {
    setDisplayOrderIds(newIds);
    storageSet(STORAGE_KEYS.DISPLAY_ORDER, newIds);
  }, []);

  const onSyncToggle = useCallback(() => {
    if (syncOrder) {
      // Turn sync OFF — initialise display order from current table order
      const ids = rows.map(r => r.id);
      setDisplayOrderIds(ids);
      setSyncOrder(false);
      storageSet(STORAGE_KEYS.DISPLAY_ORDER, ids);
      storageSet(STORAGE_KEYS.SYNC_ORDER, false);
    } else {
      // Turn sync ON — clear independent display order
      setDisplayOrderIds([]);
      setSyncOrder(true);
      storageSet(STORAGE_KEYS.DISPLAY_ORDER, []);
      storageSet(STORAGE_KEYS.SYNC_ORDER, true);
    }
  }, [syncOrder, rows]);

  // ── Drag/collapse ────────────────────────────────────────────────
  function startDrag(e: React.MouseEvent | React.TouchEvent) {
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

  // ── Loading ──────────────────────────────────────────────────────
  if (!mounted) {
    return (
      <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#06080a" }}>
        <div style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "#5a6373" }}>
          Loading…
        </div>
      </div>
    );
  }

  // ── Fullscreen (all breakpoints) ─────────────────────────────────
  if (fullscreen) {
    return (
      <div style={{ height: "100dvh", width: "100vw", overflow: "hidden", background: "#06080a" }}>
        <LivePreview
          tweaks={tweaks}
          rows={displayRows}
          logo={logo}
          bg={bg}
          fullscreen={true}
          onExit={() => setFullscreen(false)}
        />
      </div>
    );
  }

  // ── Tablet portrait + mobile: tab layout ─────────────────────────
  if (!isDesktop) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100dvh",
          background: "#06080a",
          overflow: "hidden",
        }}
      >
        {/* Tab header */}
        <div className="lc-tab-header">
          {/* Brand row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 18, height: 18, borderRadius: 5,
                  background: tweaks.accent,
                  boxShadow: `0 0 12px color-mix(in oklab, ${tweaks.accent} 30%, transparent)`,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  color: "var(--lc-text)",
                }}
              >
                LiveCheck<span style={{ color: tweaks.accent }}>.</span>
              </span>
            </div>

            {/* Go Live button */}
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: tweaks.accent,
                color: "#001005",
                border: 0,
                borderRadius: 9,
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.02em",
                cursor: "pointer",
                minHeight: 38,
                boxShadow: `0 4px 18px color-mix(in oklab, ${tweaks.accent} 40%, transparent)`,
              }}
              onClick={() => setFullscreen(true)}
            >
              <IconFullscreen />
              Go Live
            </button>
          </div>

          {/* Tab buttons */}
          <div style={{ display: "flex", padding: "0 4px" }}>
            {(["dashboard", "preview"] as const).map((tab) => (
              <button
                key={tab}
                className={`lc-tab-btn${activeTab === tab ? " is-active" : ""}`}
                style={{ borderBottomColor: activeTab === tab ? tweaks.accent : "transparent" }}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "dashboard" ? "Dashboard" : "Live Preview"}
              </button>
            ))}
          </div>
        </div>

        {/* Panel content — both rendered, toggled via display */}
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden", position: "relative" }}>
          <div
            style={{
              position: "absolute", inset: 0,
              display: activeTab === "dashboard" ? "flex" : "none",
              flexDirection: "column",
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
              showHeader={false}
              syncOrder={syncOrder}
              onSyncToggle={onSyncToggle}
              onGoLive={() => setFullscreen(true)}
            />
          </div>
          <div
            style={{
              position: "absolute", inset: 0,
              display: activeTab === "preview" ? "flex" : "none",
              flexDirection: "column",
            }}
          >
            <LivePreview
              tweaks={tweaks}
              rows={displayRows}
              logo={logo}
              bg={bg}
              fullscreen={false}
              onExit={() => {}}
              onReorder={syncOrder ? undefined : onDisplayReorder}
            />
          </div>
        </div>

        {/* iOS home indicator spacer */}
        <div className="lc-safe-bottom" />
      </div>
    );
  }

  // ── Desktop / tablet landscape: drag-divider layout ───────────────
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
          syncOrder={syncOrder}
          onSyncToggle={onSyncToggle}
          onGoLive={() => setFullscreen(true)}
        />
      </div>

      {/* Drag divider */}
      <div
        className="lc-divider"
        onMouseDown={startDrag}
        onTouchStart={startDrag}
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
            {collapsed ? <path d="M9 6l6 6-6 6" /> : <path d="M15 6l-6 6 6 6" />}
          </svg>
        </button>
      </div>

      {/* Live preview */}
      <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
        <LivePreview
          tweaks={tweaks}
          rows={displayRows}
          logo={logo}
          bg={bg}
          fullscreen={false}
          onExit={() => setFullscreen(false)}
          onReorder={syncOrder ? undefined : onDisplayReorder}
        />
      </div>
    </div>
  );
}
