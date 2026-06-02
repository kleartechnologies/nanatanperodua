"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";

import type { TweakSettings, CarModel } from "@/lib/types";
import { TWEAK_DEFAULTS, DEFAULT_ROWS, STORAGE_KEYS } from "@/lib/constants";
import { storageGet, storageSet, withAlpha } from "@/lib/utils";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { LivePreview } from "@/components/live/LivePreview";

const MIN_W = 260;
const MAX_W_RATIO = 0.65;
const DEFAULT_W_RATIO = 0.30;

// ── Diagnostics ───────────────────────────────────────────────────
// Prefix every log so iPad users can filter quickly in Safari DevTools.
function lcLog(scope: string, msg: string, ...extra: unknown[]) {
  // eslint-disable-next-line no-console
  console.log(`[LiveCheck:${scope}] ${msg}`, ...extra);
}
function lcWarn(scope: string, msg: string, ...extra: unknown[]) {
  // eslint-disable-next-line no-console
  console.warn(`[LiveCheck:${scope}] ${msg}`, ...extra);
}
function lcError(scope: string, msg: string, ...extra: unknown[]) {
  // eslint-disable-next-line no-console
  console.error(`[LiveCheck:${scope}] ${msg}`, ...extra);
}

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

  // Populated when initialization recovers from an error (shown in warning banner)
  const [initWarning, setInitWarning] = useState<string | null>(null);

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
    lcLog("init", "Starting dashboard initialization…");

    let mqCleanup: (() => void) | undefined;

    // ── Safety timeout ───────────────────────────────────────────
    // Belt-and-suspenders: if the try block somehow never reaches
    // setMounted(true) (e.g. a browser API is missing), this timer
    // force-shows the dashboard after 3 s so the user is never stuck.
    const safetyTimer = window.setTimeout(() => {
      lcWarn("init", "Safety timeout fired — initialization took >3 s. Showing dashboard with defaults.");
      setInitWarning("Initialization timed out. Some settings may have reverted to defaults.");
      setMounted(true);
    }, 3000);

    try {
      // ── localStorage ─────────────────────────────────────────
      lcLog("storage", "Reading saved state from localStorage…");
      try {
        const savedTweaks = storageGet<TweakSettings>(STORAGE_KEYS.TWEAKS, TWEAK_DEFAULTS);
        setTweaksRaw(savedTweaks);
        lcLog("storage", "tweaks loaded", savedTweaks.accent, savedTweaks.displayMode);

        const savedRows = storageGet<CarModel[]>(STORAGE_KEYS.ROWS, DEFAULT_ROWS);
        setRowsRaw(savedRows);
        lcLog("storage", `rows loaded (${savedRows.length} models)`);

        setLogoRaw(storageGet<string | null>(STORAGE_KEYS.LOGO, null));
        setBgRaw(storageGet<string | null>(STORAGE_KEYS.BG, null));
        setSyncOrder(storageGet<boolean>(STORAGE_KEYS.SYNC_ORDER, true));
        const savedOrder = storageGet<number[]>(STORAGE_KEYS.DISPLAY_ORDER, []);
        setDisplayOrderIds(savedOrder);
        lcLog("storage", `display order: ${savedOrder.length} ids`);
      } catch (storageErr) {
        lcWarn("storage", "localStorage read failed — using defaults.", storageErr);
        setInitWarning("Some saved settings could not be loaded (localStorage unavailable). Using defaults.");
      }

      // ── Panel resize ──────────────────────────────────────────
      lcLog("resize", "Calculating admin panel width…");
      try {
        const saved = storageGet<number>(STORAGE_KEYS.ADMIN_WIDTH, 0);
        const init = saved > MIN_W ? saved : Math.round(window.innerWidth * DEFAULT_W_RATIO);
        setAdminWidth(init);
        lastExpandedWidth.current = init;
        lcLog("resize", `admin panel width = ${init}px (saved: ${saved}px)`);
      } catch (resizeErr) {
        const fallback = Math.round(window.innerWidth * DEFAULT_W_RATIO);
        setAdminWidth(fallback);
        lastExpandedWidth.current = fallback;
        lcWarn("resize", `Width calculation failed, using fallback ${fallback}px.`, resizeErr);
      }

      // ── Media query / breakpoint ──────────────────────────────
      lcLog("mq", "Detecting screen size via matchMedia…");
      try {
        const mq = window.matchMedia("(min-width: 1024px)");
        setIsDesktop(mq.matches);
        lcLog("mq", `window.innerWidth=${window.innerWidth}px → isDesktop=${mq.matches}`);

        // addEventListener requires Safari 14+; fall back to addListener.
        const handleMQ = (e: MediaQueryListEvent | MediaQueryList) => {
          lcLog("mq", `Breakpoint changed → isDesktop=${e.matches}`);
          setIsDesktop(e.matches);
        };
        if (typeof mq.addEventListener === "function") {
          mq.addEventListener("change", handleMQ as (e: MediaQueryListEvent) => void);
          mqCleanup = () => mq.removeEventListener("change", handleMQ as (e: MediaQueryListEvent) => void);
          lcLog("mq", "Using addEventListener for MQ listener");
        } else {
          const legacy = mq as unknown as {
            addListener: (fn: (e: MediaQueryList) => void) => void;
            removeListener: (fn: (e: MediaQueryList) => void) => void;
          };
          legacy.addListener(handleMQ as (e: MediaQueryList) => void);
          mqCleanup = () => legacy.removeListener(handleMQ as (e: MediaQueryList) => void);
          lcWarn("mq", "Using deprecated addListener — Safari < 14 detected");
        }
      } catch (mqErr) {
        // matchMedia unavailable — default to desktop layout
        lcWarn("mq", "window.matchMedia unavailable. Defaulting to desktop layout.", mqErr);
        setIsDesktop(true);
        setInitWarning("Media query detection failed. Layout may not adapt to screen size.");
      }

      // ── All done ──────────────────────────────────────────────
      clearTimeout(safetyTimer);
      lcLog("init", "Initialization complete — mounting dashboard ✓");
      setMounted(true);

    } catch (err) {
      // Catch-all: something completely unexpected happened.
      // Log it, cancel the safety timer, show dashboard anyway.
      lcError("init", "Unexpected initialization error — showing dashboard with defaults.", err);
      const msg = err instanceof Error ? err.message : String(err);
      setInitWarning(`Dashboard initialized with errors: ${msg}. Some features may be limited.`);
      clearTimeout(safetyTimer);
      setMounted(true);
    }

    return () => {
      clearTimeout(safetyTimer);
      mqCleanup?.();
    };
  }, []);

  // ── Persist admin width ──────────────────────────────────────────
  useEffect(() => {
    if (adminWidth > 0 && !collapsed) {
      storageSet(STORAGE_KEYS.ADMIN_WIDTH, adminWidth);
    }
  }, [adminWidth, collapsed]);

  // ── Accent CSS vars ──────────────────────────────────────────────
  // Use withAlpha() instead of color-mix() — color-mix requires Safari 16.2.
  useEffect(() => {
    document.documentElement.style.setProperty("--lc-accent", tweaks.accent);
    document.documentElement.style.setProperty("--lc-accent-soft", withAlpha(tweaks.accent, 0.30));
    document.documentElement.style.setProperty("--lc-accent-dim",  withAlpha(tweaks.accent, 0.12));
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
    // Shared cleanup for both touchend and touchcancel.
    // touchcancel fires on iPad when a system overlay (notification, call,
    // Slide Over panel) interrupts a touch — without this the divider stays
    // locked in the "is-resizing" state.
    function endTouchDrag() {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.classList.remove("is-resizing");
    }
    window.addEventListener("touchmove",   onTouchMove, { passive: false });
    window.addEventListener("touchend",    endTouchDrag);
    window.addEventListener("touchcancel", endTouchDrag); // ← iPad interrupt fix
    return () => {
      window.removeEventListener("touchmove",   onTouchMove);
      window.removeEventListener("touchend",    endTouchDrag);
      window.removeEventListener("touchcancel", endTouchDrag);
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

  // ── Warning banner (shown when init recovered from an error) ────────
  const WarningBanner = initWarning ? (
    <div
      role="alert"
      style={{
        position: "fixed",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "rgba(36,28,6,0.97)",
        border: "1px solid rgba(230,160,30,0.35)",
        borderRadius: 12,
        padding: "10px 14px",
        maxWidth: "min(92vw, 500px)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.55)",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e8a020" strokeWidth="2" style={{ flexShrink: 0 }}>
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <span style={{ fontSize: 12, color: "#e8a020", flex: 1, lineHeight: 1.5 }}>
        {initWarning}
      </span>
      <button
        onClick={() => setInitWarning(null)}
        aria-label="Dismiss warning"
        style={{
          background: "transparent",
          border: 0,
          color: "#8a93a3",
          cursor: "pointer",
          padding: "2px 4px",
          fontSize: 16,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  ) : null;

  // ── Loading ──────────────────────────────────────────────────────
  // This screen is shown only during the first paint (before the mount
  // useEffect completes).  It is guaranteed to disappear within 3 seconds
  // due to the safety timer in the effect above.
  if (!mounted) {
    return (
      <div
        className="lc-screen"
        style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "#06080a" }}
      >
        {/* Animated dot trio */}
        <div style={{ display: "flex", gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 7, height: 7, borderRadius: "50%",
                background: "var(--lc-accent)",
                display: "block",
                animation: `lc-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                opacity: 0.8,
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#5a6373" }}>
          LiveCheck
        </div>
      </div>
    );
  }

  // ── Fullscreen (all breakpoints) ─────────────────────────────────
  if (fullscreen) {
    return (
      <div className="lc-screen" style={{ width: "100vw", overflow: "hidden", background: "#06080a" }}>
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
        className="lc-screen"
        style={{
          display: "flex",
          flexDirection: "column",
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
                  boxShadow: `0 0 12px ${withAlpha(tweaks.accent, 0.30)}`,
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
                boxShadow: `0 4px 18px ${withAlpha(tweaks.accent, 0.40)}`,
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

        {WarningBanner}
      </div>
    );
  }

  // ── Desktop / tablet landscape: drag-divider layout ───────────────
  const panelW = collapsed ? 0 : adminWidth;

  return (
    <div
      className="lc-screen w-screen overflow-hidden flex"
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

      {WarningBanner}
    </div>
  );
}
