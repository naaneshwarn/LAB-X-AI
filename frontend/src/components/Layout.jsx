import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  AlertCircle,
  Atom,
  BookOpen,
  Bot,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Cpu,
  Dna,
  FlaskConical,
  Globe,
  History,
  Home,
  Info,
  Layers,
  LayoutDashboard,
  Menu,
  Moon,
  PlaySquare,
  Settings,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LANGUAGE_METADATA } from '../i18n/translations';

const LAB_DROPDOWN_ITEMS = [
  {
    to: '/library?subject=Biology',
    label: 'Biology Lab',
    desc: 'Human Body, Cells, DNA & Ecology',
    icon: Dna,
    color: 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300',
  },
  {
    to: '/library?subject=Chemistry',
    label: 'Chemistry Lab',
    desc: 'pH Meter, Reactions & Periodic Table',
    icon: FlaskConical,
    color: 'bg-green-100 text-green-600 dark:bg-green-950/60 dark:text-green-300',
  },
  {
    to: '/library?subject=Physics',
    label: 'Physics Lab',
    desc: 'Electricity, Mechanics, Optics & Waves',
    icon: Atom,
    color: 'bg-sky-100 text-blue-600 dark:bg-blue-950/60 dark:text-sky-300',
  },
  {
    to: '/library?subject=Mathematics',
    label: 'Mathematics Lab',
    desc: 'Geometry, Trig, Calculus & Matrices',
    icon: Calculator,
    color: 'bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300',
  },
];

export default function Layout({ children }) {
  const {
    language,
    setLanguage,
    theme,
    setTheme,
    lowPowerMode,
    setLowPowerMode,
    backendHealth,
    toasts,
    dismissToast,
    t,
  } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [labsMenuOpen, setLabsMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  // Close menus on route change or Escape / outside click
  useEffect(() => {
    setMobileOpen(false);
    setLabsMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setLabsMenuOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLabsMenuOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const isOnline = backendHealth?.status === 'healthy';
  const isLabActive =
    location.pathname.startsWith('/library') ||
    location.pathname.startsWith('/lab') ||
    location.pathname.startsWith('/subjects');

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-[#1E293B] transition-colors dark:bg-navy-950 dark:text-slate-100">
      {/* Sticky Welcoming Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-sky-200/80 bg-white/95 backdrop-blur-md dark:border-navy-800 dark:bg-navy-950/95">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          {/* Brand Identity */}
          <Link to="/" className="group flex shrink-0 items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-sm transition duration-200 group-hover:scale-105">
              <Atom className="h-5 w-5" />
            </div>
            <div>
              <span className="flex items-center gap-1.5 text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                LabXAI
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-extrabold text-blue-700 dark:bg-blue-950 dark:text-sky-300">
                  Virtual Lab
                </span>
              </span>
              <span className="hidden text-[11px] font-medium text-slate-500 sm:block dark:text-slate-400">
                Experiment · Explore · Create
              </span>
            </div>
          </Link>

          {/* Desktop Primary Navigation */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary Navigation">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-sky-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-navy-800 dark:hover:text-white'
                }`
              }
            >
              <Home className="h-3.5 w-3.5" />
              {t('nav.home')}
            </NavLink>

            {/* Explore Experiments + Subject Labs Dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setLabsMenuOpen((o) => !o)}
                aria-expanded={labsMenuOpen}
                aria-haspopup="menu"
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                  isLabActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-sky-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-navy-800 dark:hover:text-white'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Explore Labs
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${labsMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {labsMenuOpen && (
                <div
                  role="menu"
                  className="absolute left-0 top-full z-50 mt-2 w-[340px] rounded-2xl border border-sky-100 bg-white p-2.5 shadow-elevated dark:border-navy-700 dark:bg-navy-900"
                >
                  <div className="mb-1.5 px-2.5 pt-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Subject Laboratories
                  </div>
                  <div className="space-y-1">
                    {LAB_DROPDOWN_ITEMS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.label}
                          to={item.to}
                          role="menuitem"
                          className="group flex items-center gap-3 rounded-xl p-2 transition hover:bg-sky-50/80 dark:hover:bg-navy-800"
                        >
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.color}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-extrabold text-slate-900 group-hover:text-blue-700 dark:text-white dark:group-hover:text-sky-300">
                              {item.label}
                            </p>
                            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                              {item.desc}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-1 border-t border-slate-100 pt-2 dark:border-navy-800">
                    <Link
                      to="/library"
                      role="menuitem"
                      className="rounded-lg bg-slate-50 px-2 py-1.5 text-center text-[11px] font-bold text-slate-700 hover:bg-sky-50 hover:text-blue-700 dark:bg-navy-950 dark:text-slate-200"
                    >
                      All Labs
                    </Link>
                    <Link
                      to="/videos"
                      role="menuitem"
                      className="rounded-lg bg-slate-50 px-2 py-1.5 text-center text-[11px] font-bold text-slate-700 hover:bg-sky-50 hover:text-blue-700 dark:bg-navy-950 dark:text-slate-200"
                    >
                      Videos
                    </Link>
                    <Link
                      to="/quizzes"
                      role="menuitem"
                      className="rounded-lg bg-slate-50 px-2 py-1.5 text-center text-[11px] font-bold text-slate-700 hover:bg-sky-50 hover:text-blue-700 dark:bg-navy-950 dark:text-slate-200"
                    >
                      Quizzes
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Physics Playground (Prominent Feature) */}
            <NavLink
              to="/playground"
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold transition ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-950/40 dark:text-orange-300 dark:hover:bg-orange-900/50'
                }`
              }
            >
              <Cpu className="h-3.5 w-3.5" />
              {t('nav.playground')}
            </NavLink>

            {/* STEM Engineering Challenges */}
            <NavLink
              to="/challenges"
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold transition ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/50'
                }`
              }
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              STEM Challenges
            </NavLink>

            {/* Quick Subject Shortcuts */}
            <NavLink
              to="/lab/human-respiratory-system"
              className={({ isActive }) =>
                `hidden items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold transition 2xl:inline-flex ${
                  isActive
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-rose-50 hover:text-rose-700 dark:text-slate-300 dark:hover:bg-navy-800'
                }`
              }
            >
              <Dna className="h-3.5 w-3.5 text-rose-500" />
              Biology Lab
            </NavLink>
            <NavLink
              to="/lab/chemical-reaction-playground"
              className={({ isActive }) =>
                `hidden items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold transition 2xl:inline-flex ${
                  isActive
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-green-50 hover:text-green-700 dark:text-slate-300 dark:hover:bg-navy-800'
                }`
              }
            >
              <FlaskConical className="h-3.5 w-3.5 text-green-600" />
              Chemistry Lab
            </NavLink>

            <NavLink
              to="/tutor"
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-sky-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-navy-800 dark:hover:text-white'
                }`
              }
            >
              <Bot className="h-3.5 w-3.5" />
              {t('nav.tutor')}
            </NavLink>

            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-sky-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-navy-800 dark:hover:text-white'
                }`
              }
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              {t('nav.dashboard')}
            </NavLink>
          </nav>

          {/* Right Controls */}
          <div className="flex shrink-0 items-center gap-1.5">
            {/* Low-Power 2D Mode Toggle */}
            <button
              type="button"
              onClick={() => setLowPowerMode(!lowPowerMode)}
              title={
                lowPowerMode
                  ? '2D Lite Mode ON (optimized for school computers)'
                  : 'Switch to 2D Lite Mode for low-end hardware'
              }
              aria-pressed={lowPowerMode}
              className={`hidden items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition sm:inline-flex ${
                lowPowerMode
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-300'
              }`}
            >
              {lowPowerMode ? '2D Lite' : '3D/2D'}
            </button>

            {/* 5-Language Switcher */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-2 py-0.5 dark:border-navy-700 dark:bg-navy-900">
              <Globe className="mr-1 h-3.5 w-3.5 text-blue-600 dark:text-sky-400" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                aria-label="Select application language"
                className="bg-transparent py-1 pr-1 text-xs font-bold text-slate-800 focus:outline-none dark:text-white"
              >
                {LANGUAGE_METADATA.map((l) => (
                  <option key={l.code} value={l.code} className="text-slate-900">
                    {l.nativeName} ({l.code.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Settings Icon */}
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `hidden rounded-xl border p-2 transition sm:inline-flex ${
                  isActive
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-navy-700 dark:text-slate-300 dark:hover:bg-navy-800'
                }`
              }
              aria-label="Laboratory Settings"
              title="Settings & Accessibility"
            >
              <Settings className="h-4 w-4" />
            </NavLink>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-navy-700 dark:text-slate-300 dark:hover:bg-navy-800"
              aria-label="Toggle color theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="rounded-xl border border-slate-200 p-2 text-slate-700 lg:hidden dark:border-navy-700 dark:text-slate-200"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Navigation Drawer */}
        {mobileOpen && (
          <nav
            aria-label="Mobile Navigation"
            className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden dark:border-navy-800 dark:bg-navy-950"
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                { to: '/', label: t('nav.home'), icon: Home },
                { to: '/library', label: 'Explore Labs', icon: BookOpen },
                { to: '/playground', label: t('nav.playground'), icon: Cpu },
                { to: '/challenges', label: 'STEM Challenges', icon: Sparkles },
                { to: '/library?subject=Biology', label: 'Biology Lab', icon: Dna },
                { to: '/library?subject=Chemistry', label: 'Chemistry Lab', icon: FlaskConical },
                { to: '/library?subject=Mathematics', label: 'Math Lab', icon: Calculator },
                { to: '/tutor', label: t('nav.tutor'), icon: Bot },
                { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
                { to: '/quizzes', label: t('nav.quizzes'), icon: ClipboardList },
                { to: '/videos', label: t('nav.videos'), icon: PlaySquare },
                { to: '/history', label: t('nav.history'), icon: History },
                { to: '/settings', label: t('nav.settings'), icon: Settings },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 dark:border-navy-800 dark:bg-navy-900 dark:text-slate-200"
                  >
                    <Icon className="h-4 w-4 text-blue-600 dark:text-sky-400" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Structured Multi-Column Educational Footer */}
      <footer className="border-t border-sky-200/70 bg-white pt-12 pb-8 dark:border-navy-800 dark:bg-navy-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand Column */}
            <div>
              <Link to="/" className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white">
                  <Atom className="h-5 w-5" />
                </div>
                <span className="text-base font-extrabold text-slate-900 dark:text-white">LabXAI</span>
              </Link>
              <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Making practical, interactive science and mathematics learning accessible to every student — built for curiosity, clarity, and low-resource school classrooms.
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-navy-800 dark:bg-navy-900 dark:text-slate-300">
                <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                Backend API: {isOnline ? 'Connected' : 'Offline Mode'}
              </div>
            </div>

            {/* Subjects Column */}
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                Virtual Laboratories
              </h3>
              <ul className="mt-3 space-y-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <li><Link to="/library?subject=Physics" className="hover:text-blue-600">Physics Experiments</Link></li>
                <li><Link to="/library?subject=Chemistry" className="hover:text-green-600">Virtual Chemistry Lab</Link></li>
                <li><Link to="/library?subject=Biology" className="hover:text-rose-500">Human Body &amp; Biology Lab</Link></li>
                <li><Link to="/library?subject=Mathematics" className="hover:text-violet-600">Mathematics Simulations</Link></li>
                <li><Link to="/playground" className="font-bold text-orange-600 hover:underline">Physics Playground</Link></li>
                <li><Link to="/challenges" className="font-bold text-amber-600 hover:underline">STEM Challenges</Link></li>
              </ul>
            </div>

            {/* Learning Resources */}
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                Learning Resources
              </h3>
              <ul className="mt-3 space-y-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <li><Link to="/dashboard" className="hover:text-blue-600">Student Dashboard</Link></li>
                <li><Link to="/tutor" className="hover:text-blue-600">AI Science &amp; Math Tutor</Link></li>
                <li><Link to="/videos" className="hover:text-blue-600">Educational Video Library</Link></li>
                <li><Link to="/quizzes" className="hover:text-blue-600">Interactive Quizzes</Link></li>
                <li><Link to="/history" className="hover:text-blue-600">Observation History</Link></li>
              </ul>
            </div>

            {/* Languages & Accessibility */}
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                Supported Languages
              </h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {LANGUAGE_METADATA.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setLanguage(lang.code)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                      language === lang.code
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-sky-300 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-300'
                    }`}
                  >
                    {lang.nativeName}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                Keyboard accessible · Reduced-motion friendly · Works without dedicated GPU in 2D Lite mode.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5 text-xs text-slate-500 dark:border-navy-800 dark:text-slate-400">
            <span>LabXAI — Interactive Virtual Science &amp; Mathematics Laboratory</span>
            <div className="flex items-center gap-4">
              <Link to="/subjects" className="hover:text-blue-600">Subjects</Link>
              <Link to="/library" className="hover:text-blue-600">Experiments</Link>
              <Link to="/settings" className="hover:text-blue-600">Accessibility &amp; Settings</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm shadow-elevated ${
              toast.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100'
                : toast.type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100'
                : 'border-sky-200 bg-white text-slate-800 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-100'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            ) : (
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            )}
            <span className="flex-1 text-xs font-semibold">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
