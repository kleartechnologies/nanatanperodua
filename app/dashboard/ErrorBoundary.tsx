"use client";

import React from "react";

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global React Error Boundary for the entire dashboard tree.
 *
 * If DashboardClient (or anything it renders) throws an unhandled error,
 * this boundary catches it, logs it, and shows a recoverable error screen
 * instead of a blank / crashed page.
 *
 * "Try Again" resets the boundary and remounts the tree.
 * "Reload Page" does a hard browser refresh.
 */
export class DashboardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[LiveCheck:boundary] Unhandled render error caught.");
    console.error("[LiveCheck:boundary] Error:", error.message);
    console.error("[LiveCheck:boundary] Component stack:", info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const msg = this.state.error?.message ?? "Unknown error";

    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          background: "#06080a",
          padding: 24,
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Warning icon */}
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#e8a020" strokeWidth="1.5">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>

        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#e8edf3", marginBottom: 8 }}>
            Dashboard error
          </div>
          <div style={{ fontSize: 13, color: "#8a93a3", maxWidth: 360, lineHeight: 1.65 }}>
            An unexpected error stopped the dashboard from rendering.
            Open the browser console for the full stack trace.
          </div>
          {/* Error message chip */}
          <div
            style={{
              marginTop: 14,
              padding: "8px 12px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,80,50,0.25)",
              borderRadius: 8,
              fontFamily: "ui-monospace, monospace",
              fontSize: 11,
              color: "#e05030",
              textAlign: "left",
              wordBreak: "break-word",
              maxWidth: 360,
              lineHeight: 1.5,
            }}
          >
            {msg}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={this.handleReset}
            style={{
              background: "#7CFF6B",
              color: "#001005",
              border: 0,
              borderRadius: 10,
              padding: "10px 22px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              minHeight: 44,
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => typeof window !== "undefined" && window.location.reload()}
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "#e8edf3",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 10,
              padding: "10px 22px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              minHeight: 44,
            }}
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}
