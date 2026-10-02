'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  featureName?: string;
  fallback?: ReactNode;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class FeatureFlagBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('FeatureFlagBoundary caught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 text-amber-900 shadow-sm my-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-bold text-sm text-amber-900">
                {this.props.featureName || 'Experimental Feature'} Temporarily Isolated
              </h3>
              <p className="text-xs text-amber-700 mt-1">
                This feature failed safely in isolation to prevent taking down the main dashboard. Other features remain fully operational.
              </p>
            </div>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-3 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition"
          >
            Retry Feature
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
