"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Name of the panel/section for error display */
  name?: string;
  /** Optional fallback UI — if not provided, uses a default crash card */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary — catches render errors in child components
 * and displays a recovery UI instead of crashing the entire page.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.name ? `: ${this.props.name}` : ""}] Caught error:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            minHeight: 120,
            padding: 24,
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontFamily: "monospace",
              color: "#f87171",
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            <span style={{ fontSize: 18, display: "block", marginBottom: 8 }}>⚠</span>
            {this.props.name ? `${this.props.name} crashed` : "Something went wrong"}
          </div>
          <div
            style={{
              fontSize: 10,
              fontFamily: "monospace",
              color: "rgba(248,113,113,0.6)",
              maxWidth: 300,
              textAlign: "center",
              wordBreak: "break-word",
            }}
          >
            {this.state.error?.message?.slice(0, 150) ?? "Unknown error"}
          </div>
          <button
            onClick={this.handleRetry}
            style={{
              marginTop: 8,
              padding: "6px 16px",
              fontSize: 11,
              fontFamily: "monospace",
              color: "#e2e8f0",
              backgroundColor: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 6,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)"; }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper component for easy inline usage with function components.
 * Usage: <PanelBoundary name="File Explorer"><FileExplorer /></PanelBoundary>
 */
export function PanelBoundary({ name, children }: { name: string; children: ReactNode }) {
  return <ErrorBoundary name={name}>{children}</ErrorBoundary>;
}
