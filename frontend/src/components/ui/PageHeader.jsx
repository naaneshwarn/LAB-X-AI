import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * Standardized accessible PageHeader with breadcrumbs, title, subtitle, and optional right action.
 */
export default function PageHeader({ breadcrumbs = [], badge, title, subtitle, rightSlot }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200/80 pb-5 dark:border-navy-800">
      <div className="max-w-3xl">
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.label}>
                {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                {crumb.to ? (
                  <Link to={crumb.to} className="transition hover:text-blue-600 dark:hover:text-sky-400">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-slate-800 dark:text-slate-200">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        {badge && <div className="mb-2">{badge}</div>}
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {subtitle}
          </p>
        )}
      </div>
      {rightSlot && <div className="shrink-0">{rightSlot}</div>}
    </div>
  );
}
