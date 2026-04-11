"use client";

// React class-based error boundary — the only way to catch render errors in React.
// Wraps a single dashboard or admin section so a failure in that section renders
// an inline error state instead of crashing the whole page.

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  // Used in the error message: "Content cards failed to load."
  label?: string;
}

interface State {
  hasError: boolean;
}

export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  private reset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      const label = this.props.label ?? "This section";
      return (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
          <p className="font-dm-sans text-sm text-[var(--text-muted)] mb-3">
            {label} failed to load.
          </p>
          <button
            onClick={this.reset}
            className="font-dm-sans text-sm text-[var(--text-mid)] border border-[var(--border)] rounded-lg px-3 py-1.5 hover:border-[var(--border-bright)] hover:text-[var(--text-primary)] transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
