import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends (Component as any) {
  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = this.state.error?.message || 'An unexpected error occurred';
      let isFirestoreError = false;

      try {
        // Check if it's the JSON error from handleFirestoreError
        const parsed = JSON.parse(errorMessage);
        if (parsed.error && parsed.operationType) {
          errorMessage = `Firestore Error: ${parsed.error} (Operation: ${parsed.operationType}, Path: ${parsed.path})`;
          isFirestoreError = true;
        }
      } catch (e) {
        // Not a JSON error, keep original message
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B1120] p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl p-8 text-center border border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Something went wrong
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm leading-relaxed">
              {errorMessage}
            </p>
            {isFirestoreError && (
              <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-500/10 rounded-lg text-amber-700 dark:text-amber-400 text-xs text-left font-mono overflow-auto max-h-32">
                Check your Firestore Security Rules and ensure the database is provisioned correctly.
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-[#00A3FF] hover:bg-[#008BDB] text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
