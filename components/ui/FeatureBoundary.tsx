"use client";

import React from "react";

interface Props {
  /** Human-readable name used in console logs (e.g. "table-drag"). */
  feature: string;
  children: React.ReactNode;
  /**
   * What to render if the feature crashes.
   * Pass a static / non-crashing fallback so the rest of the dashboard
   * keeps working even when this feature is broken.
   * If omitted the crashed feature is silently hidden.
   */
  fallback?: React.ReactNode;
}

interface State { crashed: boolean }

/**
 * Wraps an individual dashboard feature.
 *
 * If the wrapped component throws during render, this boundary:
 * 1. Logs a detailed error to the console.
 * 2. Renders `fallback` (or nothing) in place of the crashed feature.
 * 3. Lets every OTHER part of the dashboard continue working normally.
 *
 * Example:
 *   <FeatureBoundary feature="table-drag" fallback={<StaticTable />}>
 *     <DraggableTable />
 *   </FeatureBoundary>
 */
export class FeatureBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { crashed: false };
  }

  static getDerivedStateFromError(): State {
    return { crashed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(
      `[LiveCheck:feature] "${this.props.feature}" crashed — feature disabled, fallback rendered.`,
    );
    console.error(`[LiveCheck:feature] Error:`, error.message);
    console.error(`[LiveCheck:feature] Stack:`, info.componentStack);
  }

  render() {
    if (this.state.crashed) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
