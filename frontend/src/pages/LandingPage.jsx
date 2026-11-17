import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Atom,
  Award,
  BookOpen,
  Bot,
  CheckCircle2,
  FlaskConical,
  Globe,
  LineChart,
  ShieldCheck,
  Sliders,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { labApi } from '../api/client';
import { useApp } from '../context/AppContext';
import { LANGUAGE_METADATA } from '../i18n/translations';
import { Badge } from '../components/StatusStates';

export default function LandingPage() {
  const { language, t } = useApp();
  const [experiments, setExperiments] = useState([]);

  useEffect(() => {
    labApi
      .listExperiments()
      .then(setExperiments)
      .catch(() => setExperiments([]));
  }, []);

  const steps = [
    { icon: BookOpen, title: t('landing.step1Title'), desc: t('landing.step1Desc') },
    { icon: Sliders, title: t('landing.step2Title'), desc: t('landing.step2Desc') },
    { icon: Bot, title: t('landing.step3Title'), desc: t('landing.step3Desc') },
    { icon: Award, title: t('landing.step4Title'), desc: t('landing.step4Desc') },
  ];

  const benefits = [
    {
      icon: ShieldCheck,
      title: 'Scientifically Deterministic',
      desc: 'Every physical calculation is computed by validated physics equations — never fabricated by an LLM.',
    },
    {
      icon: LineChart,
      title: 'Real-Time Instrumentation',
      desc: 'Explore V–I curves, parabolic trajectories, pendulum harmonics, and thin-lens ray diagrams interactively.',
    },
    {
      icon: Volume2,
      title: 'Accessible Regional Learning',
      desc: 'Switch seamlessly between English and Kannada with optional Web SpeechSynthesis audio narration.',
    },
    {
      icon: FlaskConical,
      title: 'Zero Lab Hazard or Cost',
      desc: 'Test extreme voltages, Moon gravity, or optical focal singularities safely from any browser.',
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="border-b border-slate-200 bg-navy-950 text-white dark:border-navy-800">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="lg:col-span-7"
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-200">
                <Sparkles className="h-3.5 w-3.5" />
                {t('landing.badge')}
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl sm:leading-[1.12]">
                {t('landing.heroTitle')}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
                {t('landing.heroSubtitle')}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/library"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
                >
                  <FlaskConical className="h-4 w-4" />
                  {t('landing.ctaStart')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-lg border border-navy-600 bg-navy-900 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-navy-800"
                >
                  {t('landing.ctaDashboard')}
                </Link>
              </div>
            </motion.div>

            {/* Structured Lab Preview Card (No fake metrics!) */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-navy-700 bg-navy-900/90 p-6 shadow-elevated">
                <div className="mb-4 flex items-center justify-between border-b border-navy-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Atom className="h-5 w-5 text-blue-400" />
                    <span className="text-sm font-bold text-white">Active Simulation Modules</span>
                  </div>
                  <span className="font-mono text-xs text-emerald-400">4 Verified Labs</span>
                </div>
                <ul className="space-y-3 text-sm">
                  {[
                    { id: 'ohms-law', name: "Ohm's Law", formula: 'V = I × R', tag: 'Electricity' },
                    { id: 'simple-pendulum', name: 'Simple Pendulum', formula: 'T = 2π√(L/g)', tag: 'Mechanics' },
                    { id: 'projectile-motion', name: 'Projectile Motion', formula: 'R = u²sin(2θ)/g', tag: 'Kinematics' },
                    { id: 'convex-lens', name: 'Convex Lens Optics', formula: '1/f = 1/v − 1/u', tag: 'Optics' },
                  ].map((item) => (
                    <li key={item.id}>
                      <Link
                        to={`/lab/${item.id}`}
                        className="flex items-center justify-between rounded-xl border border-navy-800 bg-navy-950/70 px-4 py-3 transition hover:border-blue-500/60 hover:bg-navy-800/70"
                      >
                        <div>
                          <p className="font-semibold text-white">{item.name}</p>
                          <p className="font-mono text-xs text-blue-300">{item.formula}</p>
                        </div>
                        <span className="rounded-md bg-navy-800 px-2.5 py-1 text-xs text-slate-300">
                          {item.tag}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold text-navy-900 dark:text-white sm:text-3xl">
            {t('landing.howItWorksTitle')}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {t('landing.howItWorksSubtitle')}
          </p>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="lab-card p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-navy-900 dark:text-white">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Experiments (Loaded from Backend) */}
      <section className="border-y border-slate-200 bg-white py-16 dark:border-navy-800 dark:bg-navy-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-navy-900 dark:text-white sm:text-3xl">
                {t('landing.featuredTitle')}
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {t('landing.featuredSubtitle')}
              </p>
            </div>
            <Link to="/library" className="lab-btn-secondary">
              {t('nav.library')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {experiments.map((exp) => (
              <div key={exp.id} className="lab-card flex flex-col justify-between p-6">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="blue">{exp.subject}</Badge>
                    <Badge variant="default">
                      {exp.difficulty} · {exp.duration_minutes} {t('library.minutes')}
                    </Badge>
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-navy-900 dark:text-white">
                    {language === 'kn' ? exp.title_kn : exp.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {language === 'kn' ? exp.short_description_kn : exp.short_description}
                  </p>
                </div>
                <div className="mt-5 flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-navy-800">
                  <Link to={`/lab/${exp.id}`} className="lab-btn-primary text-xs">
                    <FlaskConical className="h-3.5 w-3.5" />
                    {t('landing.openExperiment')}
                  </Link>
                  <Link to={`/quizzes?experiment=${exp.id}`} className="lab-btn-secondary text-xs">
                    {t('dashboard.takeQuiz')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Tutor + Multilingual Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="lab-card p-7">
            <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-400">
              <Bot className="h-4 w-4" /> OpenRouter + Deterministic Guardrails
            </div>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white">
              {t('landing.aiSectionTitle')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {t('landing.aiSectionDesc')}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-200">
              {[
                'Uses your actual simulation outputs as the sole scientific source of truth',
                'Explains what happened, why it happened, common mistakes, and real-world applications',
                'Automatically falls back to deterministic scientific analysis when AI API is offline',
              ].map((pt) => (
                <li key={pt} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lab-card p-7">
            <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              <Globe className="h-4 w-4" /> Multilingual Architecture
            </div>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white">
              {t('landing.languagesTitle')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {t('landing.languagesDesc')}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {LANGUAGE_METADATA.map((lang) => (
                <div
                  key={lang.code}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-navy-700 dark:bg-navy-950"
                >
                  <p className="text-sm font-bold text-navy-900 dark:text-white">
                    {lang.nativeName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {lang.name} ·{' '}
                    <span
                      className={
                        lang.status === 'supported'
                          ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400'
                      }
                    >
                      {lang.status === 'supported' ? 'Active' : 'Roadmap'}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="mt-14">
          <h2 className="text-2xl font-bold text-navy-900 dark:text-white">
            {t('landing.benefitsTitle')}
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="lab-card p-5">
                  <Icon className="mb-3 h-5 w-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white">{b.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {b.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
