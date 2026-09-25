/**
 * Rankify Crash & Error Reporting Service
 * Tracks client-side exceptions, unhandled rejections, network failures, AI failures, and Firestore errors.
 */

export interface CrashReport {
  id: string;
  timestamp: string;
  errorName: string;
  errorMessage: string;
  stackTrace?: string;
  severity: 'fatal' | 'error' | 'warning';
  category: 'ui' | 'network' | 'ai' | 'firestore' | 'storage' | 'general';
  breadcrumbs: Breadcrumb[];
  userId?: string;
  url: string;
  userAgent: string;
}

export interface Breadcrumb {
  timestamp: string;
  message: string;
  category: 'navigation' | 'ui' | 'action' | 'sync' | 'ai';
  data?: Record<string, unknown>;
}

class CrashReporter {
  private static instance: CrashReporter;
  private breadcrumbs: Breadcrumb[] = [];
  private readonly MAX_BREADCRUMBS = 25;
  private reportsHistory: CrashReport[] = [];
  private currentUserId?: string;

  private constructor() {
    this.initGlobalListeners();
  }

  public static getInstance(): CrashReporter {
    if (!CrashReporter.instance) {
      CrashReporter.instance = new CrashReporter();
    }
    return CrashReporter.instance;
  }

  public setUserId(uid?: string) {
    this.currentUserId = uid;
  }

  public addBreadcrumb(
    message: string,
    category: Breadcrumb['category'] = 'action',
    data?: Record<string, unknown>
  ) {
    this.breadcrumbs.push({
      timestamp: new Date().toISOString(),
      message,
      category,
      data,
    });
    if (this.breadcrumbs.length > this.MAX_BREADCRUMBS) {
      this.breadcrumbs.shift();
    }
  }

  public reportError(
    error: unknown,
    category: CrashReport['category'] = 'general',
    severity: CrashReport['severity'] = 'error',
    customMessage?: string
  ): CrashReport {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const report: CrashReport = {
      id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      errorName: errorObj.name || 'UnknownError',
      errorMessage: customMessage ? `${customMessage}: ${errorObj.message}` : errorObj.message,
      stackTrace: errorObj.stack,
      severity,
      category,
      breadcrumbs: [...this.breadcrumbs],
      userId: this.currentUserId,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    };

    this.reportsHistory.unshift(report);
    if (this.reportsHistory.length > 30) {
      this.reportsHistory.pop();
    }

    // Persist in safe storage for diagnostics
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('rankify_last_crash_report', JSON.stringify(report));
      }
    } catch {
      // Storage unavailable
    }

    console.error(`[Rankify CrashReporter][${category.toUpperCase()}]`, report.errorMessage, {
      reportId: report.id,
      severity,
      stack: report.stackTrace,
    });

    return report;
  }

  public getRecentReports(): CrashReport[] {
    return [...this.reportsHistory];
  }

  public clearReports() {
    this.reportsHistory = [];
    try {
      sessionStorage.removeItem('rankify_last_crash_report');
    } catch {}
  }

  private initGlobalListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (event) => {
      this.reportError(
        event.error || new Error(event.message),
        'ui',
        'fatal',
        `Uncaught Global Exception at ${event.filename}:${event.lineno}`
      );
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.reportError(
        event.reason || new Error('Unhandled Promise Rejection'),
        'network',
        'error',
        'Unhandled Asynchronous Promise Rejection'
      );
    });
  }
}

export const crashReporter = CrashReporter.getInstance();
