import React from 'react';
import { AlertTriangle, Inbox, Loader2, RefreshCw, X } from 'lucide-react';

export function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{message}</p>
    </div>
  );
}

export function ErrorState({ title = 'Unable to load data', message, onRetry }) {
  return (
    <div className="mx-auto my-8 max-w-lg rounded-xl border border-rose-200 bg-rose-50/70 p-6 text-center dark:border-rose-900 dark:bg-rose-950/30">
      <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-rose-600 dark:text-rose-400" />
      <h3 className="text-base font-semibold text-rose-900 dark:text-rose-200">{title}</h3>
      <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="lab-btn-secondary mt-4">
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-12 text-center dark:border-navy-700 dark:bg-navy-900/40">
      <Inbox className="mb-3 h-8 w-8 text-slate-400" />
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
      {description && (
        <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Badge({ children, variant = 'default' }) {
  const styles = {
    default: 'bg-slate-100 text-slate-700 dark:bg-navy-800 dark:text-slate-200',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    violet: 'bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800',
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    orange: 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
    rose: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[variant] || styles.default}`}>
      {children}
    </span>
  );
}

export function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-elevated dark:border-navy-700 dark:bg-navy-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-navy-900 dark:text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-navy-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
