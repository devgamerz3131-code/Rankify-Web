import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from '@/icons';
import { crashReporter } from '@/services/crash-reporter';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    crashReporter.reportError(
      error,
      'ui',
      'fatal',
      `ErrorBoundary caught component exception: ${errorInfo.componentStack?.substring(0, 150)}`
    );
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearCacheAndRestart = () => {
    try {
      localStorage.removeItem('rankify_ai_session_memory');
      sessionStorage.clear();
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-background text-foreground">
          <div className="max-w-md w-full rounded-3xl border border-slate-200/80 dark:border-white/10 bg-card p-6 sm:p-8 text-center shadow-2xl space-y-4">
            <div className="mx-auto inline-flex p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {this.props.fallbackTitle || 'Study Engine Paused'}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {this.props.fallbackMessage ||
                  'An unexpected view issue occurred. Your CBSE PCM progress and syllabus benchmarks are safely preserved in cloud cache.'}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={this.handleReset} variant="primary" className="w-full text-xs font-bold h-10">
                <RefreshCw className="w-3.5 h-3.5 mr-2" />
                Resume Study Session
              </Button>

              <button
                onClick={this.handleReload}
                className="w-full py-2 text-xs font-semibold text-muted-foreground hover:text-foreground bg-slate-100 dark:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Reload Application
              </button>

              <button
                onClick={this.handleClearCacheAndRestart}
                className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline pt-1 cursor-pointer"
              >
                Clear Corrupted View Cache & Restart
              </button>
            </div>

            {/* Diagnostic expansion for troubleshooting */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {this.state.showDetails ? 'Hide Diagnostic Info' : 'Show Diagnostic Info'}
              </button>

              {this.state.showDetails && this.state.error && (
                <div className="mt-2 p-3 bg-slate-950 text-slate-300 rounded-xl text-left font-mono text-[10px] overflow-x-auto max-h-36">
                  <p className="font-bold text-rose-400">{this.state.error.toString()}</p>
                  {this.state.errorInfo?.componentStack && (
                    <pre className="mt-1 text-slate-400 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
