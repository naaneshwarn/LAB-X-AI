import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Atom,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FlaskConical,
  Globe,
  History,
  Home,
  LayoutDashboard,
  Menu,
  Moon,
  Settings,
  Sun,
  X,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Layout({ children }) {
  const { language, setLanguage, theme, setTheme, backendHealth, toasts, dismissToast, t } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { to: '/', label: t('nav.home'), icon: Home, end: true },
    { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/library', label: t('nav.library'), icon: BookOpen },
    { to: '/lab/ohms-law', label: t('nav.lab'), icon: FlaskConical, matchPrefix: '/lab' },
    { to: '/quizzes', label: t('nav.quizzes'), icon: ClipboardList },
    { to: '/history', label: t('nav.history'), icon: History },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  const isOnline = backendHealth?.status === 'healthy';

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 transition-colors dark:bg-navy-950 dark:text-slate-100">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur dark:border-navy-800 dark:bg-navy-950/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900 text-white shadow-sm dark:bg-blue-600">
              <Atom className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-base font-extrabold tracking-tight text-navy-900 dark:text-white">
                LabXAI
              </span>
              <span className="hidden text-[11px] font-medium text-slate-500 sm:block dark:text-slate-400">
                Virtual Science Lab
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isPrefixActive =
                item.matchPrefix && location.pathname.startsWith(item.matchPrefix);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive || isPrefixActive
                        ? 'bg-navy-900 text-white dark:bg-blue-600'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-navy-900 dark:text-slate-300 dark:hover:bg-navy-800 dark:hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Backend Status Pill */}
            <div
              className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium xl:flex ${
                isOnline
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
              }`}
              title={`API Status: ${backendHealth?.status || 'checking'} | AI: ${backendHealth?.ai_engine || 'unknown'}`}
            >
              <span
                className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}
              />
              {isOnline ? t('common.backendOnline') : t('common.backendOffline')}
            </div>

            {/* Quick Language Switcher */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-navy-700 dark:bg-navy-900">
              <Globe className="mx-1.5 h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
                  language === 'en'
                    ? 'bg-white text-navy-900 shadow-sm dark:bg-blue-600 dark:text-white'
                    : 'text-slate-600 hover:text-navy-900 dark:text-slate-300'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('kn')}
                className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
                  language === 'kn'
                    ? 'bg-white text-navy-900 shadow-sm dark:bg-blue-600 dark:text-white'
                    : 'text-slate-600 hover:text-navy-900 dark:text-slate-300'
                }`}
              >
                ಕನ್ನಡ
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-navy-700 dark:text-slate-300 dark:hover:bg-navy-800"
              aria-label="Toggle color theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="rounded-lg border border-slate-200 p-2 text-slate-700 lg:hidden dark:border-navy-700 dark:text-slate-200"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileOpen && (
          <nav className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden dark:border-navy-800 dark:bg-navy-950">
            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${
                        isActive
                          ? 'bg-navy-900 text-white dark:bg-blue-600'
                          : 'bg-slate-50 text-slate-700 dark:bg-navy-900 dark:text-slate-200'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 dark:border-navy-800 dark:bg-navy-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-slate-500 sm:flex-row sm:px-6 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Atom className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-navy-900 dark:text-slate-200">LabXAI</span>
            <span>— {t('brandTagline')}</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/library" className="hover:text-blue-600">
              {t('nav.library')}
            </Link>
            <Link to="/quizzes" className="hover:text-blue-600">
              {t('nav.quizzes')}
            </Link>
            <Link to="/dashboard" className="hover:text-blue-600">
              {t('nav.dashboard')}
            </Link>
            <Link to="/settings" className="hover:text-blue-600">
              {t('nav.settings')}
            </Link>
          </div>
        </div>
      </footer>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-elevated ${
              toast.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100'
                : toast.type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100'
                : 'border-slate-200 bg-white text-slate-800 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-100'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            ) : (
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            )}
            <span className="flex-1">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
