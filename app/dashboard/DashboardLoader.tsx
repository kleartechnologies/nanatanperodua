"use client";

/**
 * Client-side loader for DashboardClient.
 *
 * next/dynamic with ssr:false must live inside a Client Component.
 * This wrapper satisfies that constraint while keeping page.tsx as a
 * lean Server Component.
 *
 * What this achieves:
 *  - Server outputs static HTML with the animated-dots loading screen.
 *  - Browser downloads the DashboardClient JS chunk independently.
 *  - DashboardClient mounts directly (no hydration, no mounted-gate).
 *  - All state is correct on first render via lazy useState initializers.
 *  - DashboardErrorBoundary catches any crash and shows a recovery screen.
 */

import dynamic from "next/dynamic";
import { DashboardErrorBoundary } from "./ErrorBoundary";

const DashboardClientDynamic = dynamic(
  () => import("./DashboardClient").then((m) => ({ default: m.DashboardClient })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: "#06080a",
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#7CFF6B",
                display: "block",
                animation: `lc-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                opacity: 0.8,
              }}
            />
          ))}
        </div>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#5a6373",
          }}
        >
          LiveCheck
        </div>
      </div>
    ),
  },
);

export function DashboardLoader() {
  return (
    <DashboardErrorBoundary>
      <DashboardClientDynamic />
    </DashboardErrorBoundary>
  );
}
