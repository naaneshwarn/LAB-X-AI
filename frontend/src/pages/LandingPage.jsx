import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Atom,
  BookOpen,
  Bot,
  Calculator,
  CheckCircle2,
  ClipboardList,
  Cpu,
  Dna,
  FlaskConical,
  Globe,
  HeartPulse,
  Laptop,
  Lightbulb,
  Microscope,
  PlaySquare,
  ShieldCheck,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { labApi } from '../api/client';
import { useApp } from '../context/AppContext';
import { getLocalizedField, LANGUAGE_METADATA, SUBJECT_COLORS } from '../i18n/translations';
import { Badge } from '../components/StatusStates';

const SUBJECT_CARDS = [
  {
    name: 'Physics',
    icon: Atom,
    accentHex: '#2563EB',
    surface: 'from-sky-50 to-blue-50/70 dark:from-blue-950/40 dark:to-navy-900',
    iconBg: 'bg-blue-600 text-white',
    description: 'Build electrical circuits, test forces on ramps, swing pendulums, and trace lenses & prisms.',
    to: '/library?subject=Physics',
    formula: 'V = I·R · F = ma',
  },
  {
    name: 'Chemistry',
    icon: FlaskConical,
    accentHex: '#22C55E',
    surface: 'from-green-50 to-emerald-50/70 dark:from-green-950/40 dark:to-navy-900',
    iconBg: 'bg-green-500 text-white',
    description: 'Mix verified reactants on a virtual bench, test pH scales, inspect atoms, and explore periodic trends.',
    to: '/library?subject=Chemistry',
    formula: 'pH = −log[H⁺] · PV = nRT',
  },
  {
    name: 'Biology',
    icon: Dna,
    accentHex: '#FB7185',
    surface: 'from-rose-50 to-emerald-50/50 dark:from-rose-950/35 dark:to-navy-900',
    iconBg: 'bg-rose-500 text-white',
    description: 'Watch lungs breathe, follow food through digestion, trace blood flow, and inspect living cells.',
    to: '/library?subject=Biology',
    formula: 'O₂ ↔ CO₂ · DNA',
  },
  {
    name: 'Mathematics',
    icon: Calculator,
    accentHex: '#A78BFA',
    surface: 'from-violet-50 to-purple-50/70 dark:from-violet-950/40 dark:to-navy-900',
    iconBg: 'bg-violet-500 text-white',
    description: 'Visualize graphs, geometry, trigonometry waves, quadratic roots, calculus, and 3D vectors dynamically.',
    to: '/library?subject=Mathematics',
    formula: 'f′(x) · ∫ f(x)dx',
  },
];

const FEATURED_EXPERIENCES = [
  {
    title: 'Interactive Physics Playground',
    badge: 'Circuits · Mechanics · Optics',
    badgeVariant: 'orange',
    desc: 'Drag batteries, resistors, LEDs, switches, and meters onto a grid canvas, draw smart snapping wires, and run live Ohm’s Law & circuit calculations.',
    to: '/playground',
    cta: 'Enter Physics Playground',
    accentBorder: 'hover:border-orange-300',
    previewType: 'circuit',
  },
  {
    title: 'Human Body Explorer',
    badge: '3D / 2D Interactive Anatomy',
    badgeVariant: 'rose',
    desc: 'Watch synchronized lungs and diaphragm breathe, trace food digestion across 14 organs, follow double blood circulation, and trigger spinal reflex arcs.',
    to: '/lab/human-respiratory-system',
    cta: 'Explore Human Body',
    accentBorder: 'hover:border-rose-300',
    previewType: 'body',
  },
  {
    title: 'Virtual Chemistry Laboratory',
    badge: '12 Realistic Lab Instruments',
    badgeVariant: 'emerald',
    desc: 'Use beakers, conical flasks, droppers, burettes, Bunsen burners, thermometers, and digital pH meters to run safe, balanced reactions.',
    to: '/lab/chemical-reaction-playground',
    cta: 'Open Chemistry Bench',
    accentBorder: 'hover:border-green-300',
    previewType: 'chemistry',
  },
  {
    title: 'Interactive Biology Laboratory',
    badge: 'Cells · DNA · Genetics',
    badgeVariant: 'emerald',
    desc: 'Inspect plant and animal cell organelles in 2D or 3D orbit, step through DNA replication and mitosis, and test Mendelian Punnett squares.',
    to: '/lab/plant-cell-structure',
    cta: 'Inspect Living Cells',
    accentBorder: 'hover:border-emerald-300',
    previewType: 'cells',
  },
  {
    title: 'Multilingual AI Science Tutor',
    badge: 'EN · ಕನ್ನಡ · हिन्दी · தமிழ் · తెలుగు',
    badgeVariant: 'blue',
    desc: 'Ask questions by typing or speaking in 5 Indian languages. The tutor explains your exact live measurements and formulas without inventing values.',
    to: '/tutor',
    cta: 'Chat with AI Tutor',
    accentBorder: 'hover:border-sky-300',
    previewType: 'tutor',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Choose a Subject',
    desc: 'Start with Physics, Chemistry, Biology, or Mathematics tailored for middle- and high-school curiosity.',
    icon: BookOpen,
    color: 'bg-sky-100 text-blue-700 dark:bg-blue-950 dark:text-sky-300',
  },
  {
    step: '02',
    title: 'Select an Experiment',
    desc: 'Pick a guided virtual lab or enter the open-ended Physics Playground to build your own setup.',
    icon: Microscope,
    color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  },
  {
    step: '03',
    title: 'Interact with the Simulation',
    desc: 'Connect wires, adjust pH or breathing rate, trigger reflexes, and watch real equations respond live.',
    icon: Sliders,
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  {
    step: '04',
    title: 'Understand Results with AI',
    desc: 'Read clear step-by-step explanations in your preferred language, listen aloud, and test yourself with a quiz.',
    icon: Bot,
    color: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  },
];

const FEATURED_LAB_IDS = [
  'human-respiratory-system',
  'chemical-reaction-playground',
  'ohms-law',
  'acids-bases-ph',
];

function ExperienceMiniPreview({ type }) {
  if (type === 'circuit') {
    return (
      <svg viewBox="0 0 240 100" className="h-24 w-full rounded-xl bg-sky-50/80 dark:bg-navy-950" aria-hidden="true">
        <path d="M40,50 L40,22 L120,22 L120,50 L200,50 L200,78 L40,78 Z" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinejoin="round" />
        <rect x="24" y="38" width="32" height="24" rx="5" fill="#2563eb" />
        <text x="40" y="54" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff">12V</text>
        <rect x="98" y="13" width="44" height="18" rx="4" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
        <text x="120" y="25" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#92400e">100Ω</text>
        <circle cx="200" cy="50" r="14" fill="#fef08a" stroke="#eab308" strokeWidth="2.5" />
        <circle cx="160" cy="78" r="4" fill="#facc15" />
      </svg>
    );
  }
  if (type === 'body') {
    return (
      <svg viewBox="0 0 240 100" className="h-24 w-full rounded-xl bg-rose-50/80 dark:bg-navy-950" aria-hidden="true">
        <rect x="115" y="12" width="10" height="28" rx="3" fill="#38bdf8" />
        <path d="M114,38 C90,38 74,56 76,78 C78,88 106,88 114,76 Z" fill="#fda4af" stroke="#e11d48" strokeWidth="2" />
        <path d="M126,38 C150,38 166,56 164,78 C162,88 134,88 126,76 Z" fill="#fda4af" stroke="#e11d48" strokeWidth="2" />
        <path d="M74,90 Q120,76 166,90" fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
        <circle cx="120" cy="24" r="3" fill="#0284c7" />
      </svg>
    );
  }
  if (type === 'chemistry') {
    return (
      <svg viewBox="0 0 240 100" className="h-24 w-full rounded-xl bg-green-50/80 dark:bg-navy-950" aria-hidden="true">
        <path d="M98,16 L116,16 L116,38 L136,84 L78,84 L98,38 Z" fill="#fff" stroke="#475569" strokeWidth="2.5" />
        <path d="M89,58 L125,58 L133,81 L81,81 Z" fill="#22c55e" fillOpacity="0.85" />
        <circle cx="104" cy="48" r="3.5" fill="#38bdf8" />
        <circle cx="114" cy="40" r="2.5" fill="#38bdf8" />
        <rect x="155" y="28" width="52" height="34" rx="7" fill="#1e293b" />
        <text x="181" y="49" textAnchor="middle" fontSize="10" fontWeight="800" fill="#22c55e">pH 7.0</text>
      </svg>
    );
  }
  if (type === 'cells') {
    return (
      <svg viewBox="0 0 240 100" className="h-24 w-full rounded-xl bg-emerald-50/80 dark:bg-navy-950" aria-hidden="true">
        <rect x="44" y="14" width="152" height="72" rx="18" fill="#dcfce7" stroke="#16a34a" strokeWidth="3" />
        <circle cx="90" cy="48" r="16" fill="#a78bfa" stroke="#6d28d9" strokeWidth="2" />
        <ellipse cx="148" cy="48" rx="28" ry="18" fill="#38bdf8" fillOpacity="0.75" />
        <ellipse cx="92" cy="72" rx="14" ry="6" fill="#16a34a" />
        <ellipse cx="142" cy="73" rx="12" ry="5.5" fill="#fb923c" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 240 100" className="h-24 w-full rounded-xl bg-sky-50/80 dark:bg-navy-950" aria-hidden="true">
      <rect x="24" y="18" width="110" height="24" rx="10" fill="#2563eb" />
      <text x="79" y="33" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff">What happens in Alveoli?</text>
      <rect x="70" y="52" width="146" height="32" rx="10" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
      <text x="143" y="66" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#1e293b">O₂ enters blood, CO₂ exits!</text>
      <text x="143" y="78" textAnchor="middle" fontSize="8" fontWeight="700" fill="#16a34a">EN · ಕನ್ನಡ · हिन्दी · தமிழ் · తెలుగు</text>
    </svg>
  );
}

export default function LandingPage() {
  const { language, t } = useApp();
  const [subjectsData, setSubjectsData] = useState([]);
  const [featuredLabs, setFeaturedLabs] = useState([]);

  useEffect(() => {
    labApi.listSubjects().then(setSubjectsData).catch(() => setSubjectsData([]));
    labApi
      .listExperiments()
      .then((all) => {
        const picked = FEATURED_LAB_IDS.map((id) => all.find((e) => e.id === id)).filter(Boolean);
        setFeaturedLabs(picked.length ? picked : all.slice(0, 4));
      })
      .catch(() => setFeaturedLabs([]));
  }, []);

  const getSubjectCount = (name) => {
    const found = subjectsData.find((s) => s.name === name);
    return found ? found.experiment_count : null;
  };

  return (
    <div>
      {/* HERO SECTION — Welcoming Experiential Science Storytelling */}
      <section className="relative overflow-hidden border-b border-sky-200/80 bg-gradient-to-br from-[#F0F9FF] via-[#F8FAFC] to-[#F0FDF4] dark:border-navy-800 dark:from-navy-950 dark:via-navy-900 dark:to-navy-950">
        {/* Soft Decorative Background Shapes */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-sky-200/35 blur-3xl dark:bg-blue-900/20" />
        <div className="pointer-events-none absolute -bottom-24 left-12 h-72 w-72 rounded-full bg-green-200/35 blur-3xl dark:bg-emerald-900/20" />

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            {/* Hero Copy */}
            <div className="lg:col-span-6">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/90 px-3.5 py-1.5 text-xs font-extrabold text-blue-700 shadow-sm dark:border-blue-800 dark:bg-navy-900 dark:text-sky-300">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Hands-On Virtual Science &amp; Math Lab for Every Student
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl sm:leading-[1.1]">
                Discover Science.{' '}
                <span className="text-blue-600 dark:text-sky-400">Experiment.</span>{' '}
                <span className="text-green-600 dark:text-emerald-400">Explore.</span>{' '}
                <span className="text-orange-500">Create.</span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
                Welcome to LabXAI — your interactive virtual science laboratory. Explore experiments, build circuits, understand the human body, and discover how the world works.
              </p>

              {/* Two Prominent Hero Actions */}
              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  to="/library"
                  className="group inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg active:scale-[0.98]"
                >
                  <FlaskConical className="h-4 w-4" />
                  Explore Experiments
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/playground"
                  className="group inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-lg active:scale-[0.98]"
                >
                  <Cpu className="h-4 w-4" />
                  Enter Physics Playground
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Language Quick Strip */}
              <div className="mt-7 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <Globe className="h-4 w-4 text-blue-600 dark:text-sky-400" />
                <span className="font-bold">Learn in 5 languages:</span>
                {LANGUAGE_METADATA.map((lang) => (
                  <span
                    key={lang.code}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-bold text-slate-700 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-200"
                  >
                    {lang.nativeName}
                  </span>
                ))}
              </div>
            </div>

            {/* Original Interactive-Looking Science Laboratory SVG Illustration */}
            <div className="lg:col-span-6">
              <div className="relative rounded-3xl border border-sky-200/80 bg-white/90 p-5 shadow-elevated dark:border-navy-700 dark:bg-navy-900/90">
                <svg
                  viewBox="0 0 520 360"
                  className="h-auto w-full rounded-2xl bg-gradient-to-br from-sky-50 via-white to-green-50/70 dark:from-navy-950 dark:via-navy-900 dark:to-navy-950"
                  role="img"
                  aria-label="Original LabXAI Virtual Science Laboratory Illustration featuring chemistry flask, glowing circuit, lungs, prism rainbow, and orbiting atom"
                >
                  {/* Soft Pastel Blobs */}
                  <circle cx="110" cy="110" r="78" fill="#38bdf8" fillOpacity="0.12" />
                  <circle cx="405" cy="245" r="92" fill="#22c55e" fillOpacity="0.12" />
                  <circle cx="385" cy="95" r="56" fill="#facc15" fillOpacity="0.18" />

                  {/* Lab Bench Table */}
                  <rect x="26" y="294" width="468" height="18" rx="9" fill="#e2e8f0" />
                  <rect x="44" y="312" width="432" height="10" rx="5" fill="#cbd5e1" />

                  {/* 1. Bubbling Chemistry Conical Flask (Left) */}
                  <g className="lab-float">
                    <path d="M96,158 L124,158 L124,195 L162,286 L58,286 L96,195 Z" fill="#ffffff" stroke="#334155" strokeWidth="3.5" strokeLinejoin="round" />
                    <path d="M77,242 L143,242 L156,282 L64,282 Z" fill="#22c55e" fillOpacity="0.88" />
                    <circle cx="102" cy="222" r="7" fill="#86efac" stroke="#16a34a" strokeWidth="2" />
                    <circle cx="118" cy="204" r="5" fill="#38bdf8" />
                    <circle cx="108" cy="144" r="6" fill="#22c55e" fillOpacity="0.65" />
                    <rect x="52" y="106" width="90" height="28" rx="14" fill="#dcfce7" stroke="#22c55e" strokeWidth="1.5" />
                    <text x="97" y="124" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#15803d">Chemistry Lab</text>
                  </g>

                  {/* 2. Glowing Physics Circuit Card (Top Center) */}
                  <g className="lab-float-delayed">
                    <rect x="180" y="34" width="166" height="96" rx="18" fill="#ffffff" stroke="#93c5fd" strokeWidth="2.5" />
                    <path d="M206,84 L206,56 L266,56 L320,56 L320,104 L206,104 Z" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinejoin="round" />
                    <rect x="192" y="72" width="28" height="22" rx="5" fill="#2563eb" />
                    <text x="206" y="86" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#fff">12V</text>
                    <rect x="244" y="47" width="42" height="18" rx="4" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
                    <text x="265" y="59" textAnchor="middle" fontSize="8" fontWeight="800" fill="#92400e">100Ω</text>
                    <circle cx="320" cy="80" r="14" fill="#fef08a" stroke="#eab308" strokeWidth="2.5" />
                    <text x="263" y="122" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#1d4ed8">I = 0.12 A · P = 1.44 W</text>
                  </g>

                  {/* 3. Human Body & Biology Lungs Card (Center Bottom) */}
                  <g>
                    <rect x="196" y="160" width="136" height="128" rx="20" fill="#fff1f2" stroke="#fda4af" strokeWidth="2.5" />
                    <rect x="259" y="176" width="10" height="24" rx="3" fill="#38bdf8" />
                    <path d="M258,200 C234,200 218,220 220,248 C222,260 250,260 258,246 Z" fill="#fb7185" fillOpacity="0.88" stroke="#be123c" strokeWidth="2" />
                    <path d="M270,200 C294,200 310,220 308,248 C306,260 278,260 270,246 Z" fill="#fb7185" fillOpacity="0.88" stroke="#be123c" strokeWidth="2" />
                    <path d="M222,268 Q264,254 306,268" fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
                    <text x="264" y="282" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#9f1239">Human Body 3D/2D</text>
                  </g>

                  {/* 4. Orbiting Atom + Prism Dispersion (Right) */}
                  <g className="lab-float">
                    <circle cx="426" cy="110" r="46" fill="#ffffff" stroke="#c4b5fd" strokeWidth="2.5" />
                    <ellipse cx="426" cy="110" rx="34" ry="13" fill="none" stroke="#8b5cf6" strokeWidth="2" transform="rotate(30 426 110)" />
                    <ellipse cx="426" cy="110" rx="34" ry="13" fill="none" stroke="#38bdf8" strokeWidth="2" transform="rotate(-30 426 110)" />
                    <circle cx="426" cy="110" r="9" fill="#7c3aed" />
                    <circle cx="456" cy="96" r="4.5" fill="#fb923c" />
                    <circle cx="398" cy="122" r="4.5" fill="#22c55e" />
                  </g>

                  {/* 5. Optics Prism with Rainbow Rays (Bottom Right) */}
                  <g>
                    <polygon points="418,196 368,284 468,284" fill="#e0f2fe" stroke="#0284c7" strokeWidth="3" />
                    <line x1="336" y1="252" x2="392" y2="242" stroke="#facc15" strokeWidth="4" />
                    <line x1="444" y1="240" x2="496" y2="226" stroke="#ef4444" strokeWidth="3" />
                    <line x1="446" y1="246" x2="496" y2="244" stroke="#22c55e" strokeWidth="3" />
                    <line x1="448" y1="252" x2="496" y2="262" stroke="#7c3aed" strokeWidth="3" />
                  </g>
                </svg>

                {/* Floating Quick-Launch Strip Below Illustration */}
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <Link
                    to="/lab/human-respiratory-system"
                    className="rounded-xl border border-rose-200 bg-rose-50/70 px-2 py-2 font-bold text-rose-800 transition hover:-translate-y-0.5 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200"
                  >
                    Respiratory Lab
                  </Link>
                  <Link
                    to="/lab/acids-bases-ph"
                    className="rounded-xl border border-green-200 bg-green-50/70 px-2 py-2 font-bold text-green-800 transition hover:-translate-y-0.5 hover:bg-green-100 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-200"
                  >
                    pH Meter Bench
                  </Link>
                  <Link
                    to="/playground"
                    className="rounded-xl border border-orange-200 bg-orange-50/70 px-2 py-2 font-bold text-orange-800 transition hover:-translate-y-0.5 hover:bg-orange-100 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-200"
                  >
                    Circuit Builder
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EXPLORE SUBJECTS — 4 Expressive Interactive Cards */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <Badge variant="blue">4 Core Disciplines</Badge>
            <h2 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
              Explore Science &amp; Mathematics Subjects
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
              Choose a subject to dive into interactive experiments, visual simulations, and quizzes.
            </p>
          </div>
          <Link to="/subjects" className="lab-btn-secondary text-xs">
            View All Subjects <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SUBJECT_CARDS.map((card) => {
            const Icon = card.icon;
            const count = getSubjectCount(card.name);
            return (
              <Link
                key={card.name}
                to={card.to}
                className={`group flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-gradient-to-br p-6 shadow-card transition duration-200 hover:-translate-y-1.5 hover:shadow-elevated dark:border-navy-800 ${card.surface}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm transition-transform duration-200 group-hover:scale-110 ${card.iconBg}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    {count !== null && (
                      <span className="rounded-full bg-white/90 px-2.5 py-1 font-mono text-[11px] font-extrabold text-slate-700 shadow-sm dark:bg-navy-900 dark:text-slate-200">
                        {count} Labs
                      </span>
                    )}
                  </div>
                  <h3 className="mt-5 text-xl font-extrabold text-slate-900 dark:text-white">
                    {card.name}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {card.description}
                  </p>
                  <p className="mt-3 font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {card.formula}
                  </p>
                </div>

                <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-700 dark:text-sky-300">
                  <span>Explore {card.name}</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEATURED LEARNING EXPERIENCES */}
      <section className="border-y border-sky-100 bg-white py-16 dark:border-navy-800 dark:bg-navy-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-9 max-w-2xl">
            <Badge variant="emerald">Hands-On Learning</Badge>
            <h2 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
              Featured Learning Experiences
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
              Jump directly into LabXAI’s signature interactive laboratories built for curiosity-driven discovery.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURED_EXPERIENCES.map((exp) => (
              <div
                key={exp.title}
                className={`group lab-card-hover flex flex-col justify-between p-5 ${exp.accentBorder}`}
              >
                <div>
                  <div className="overflow-hidden rounded-xl transition-transform duration-200 group-hover:scale-[1.02]">
                    <ExperienceMiniPreview type={exp.previewType} />
                  </div>
                  <div className="mt-4">
                    <Badge variant={exp.badgeVariant}>{exp.badge}</Badge>
                  </div>
                  <h3 className="mt-2.5 text-lg font-extrabold text-slate-900 dark:text-white">
                    {exp.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {exp.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-navy-800">
                  <Link
                    to={exp.to}
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 transition hover:text-blue-800 dark:text-sky-400"
                  >
                    {exp.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW LABXAI WORKS — 4-Step Visual Storytelling */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <Badge variant="amber">Simple 4-Step Inquiry</Badge>
          <h2 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
            How LabXAI Works
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
            Learn science the way scientists do — by observing, testing, and asking &ldquo;why?&rdquo;.
          </p>
        </div>

        <div className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Desktop Connecting Line */}
          <div className="pointer-events-none absolute left-12 right-12 top-11 hidden h-0.5 bg-gradient-to-r from-sky-300 via-emerald-300 to-violet-300 lg:block" />

          {HOW_IT_WORKS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="lab-card-hover relative p-6">
                <div className="flex items-center justify-between">
                  <div className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm ${item.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-lg font-extrabold text-slate-300 dark:text-navy-700">
                    {item.step}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-extrabold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* IMPACT & ACCESSIBILITY MISSION SECTION (Honest — Zero Fabricated Stats) */}
      <section className="border-y border-emerald-100 bg-gradient-to-r from-sky-50 via-white to-green-50 py-16 dark:border-navy-800 dark:from-navy-900 dark:via-navy-950 dark:to-navy-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <Badge variant="emerald">Our Mission</Badge>
              <h2 className="mt-3 text-2xl font-extrabold leading-tight text-slate-900 dark:text-white sm:text-3xl">
                Making practical science learning accessible to every student.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Many school classrooms lack physical microscopes, glassware, or circuit kits. LabXAI brings scientifically accurate virtual experiments right to ordinary school computers in students’ native languages.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/dashboard" className="lab-btn-primary text-xs">
                  Open Student Dashboard
                </Link>
                <Link to="/settings" className="lab-btn-secondary text-xs">
                  2D Lite &amp; Accessibility Settings
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
              {[
                {
                  icon: Lightbulb,
                  title: 'Interactive Experiential Learning',
                  desc: 'Students learn by manipulating variables, wiring circuits, and inspecting living systems rather than memorizing static paragraphs.',
                  color: 'text-amber-600 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300',
                },
                {
                  icon: Globe,
                  title: 'Regional-Language Explanations',
                  desc: 'Learn comfortably in English, Kannada, Hindi, Tamil, and Telugu with voice input, read-aloud narration, and exact scientific notation.',
                  color: 'text-blue-600 bg-sky-100 dark:bg-blue-950/60 dark:text-sky-300',
                },
                {
                  icon: ShieldCheck,
                  title: 'Safe Virtual Lab Access',
                  desc: 'Explore strong acids, high-voltage circuits, Bunsen heating, and human anatomy safely with deterministic textbook equations.',
                  color: 'text-green-600 bg-green-100 dark:bg-green-950/60 dark:text-green-300',
                },
                {
                  icon: Laptop,
                  title: 'Built for Everyday School Hardware',
                  desc: 'Lightweight vector visuals, lazy-loaded modules, and 2D Lite mode run smoothly without needing a dedicated graphics card.',
                  color: 'text-violet-600 bg-violet-100 dark:bg-violet-950/60 dark:text-violet-300',
                },
              ].map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div key={pillar.title} className="lab-card p-5">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${pillar.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-3 text-sm font-extrabold text-slate-900 dark:text-white">
                      {pillar.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {pillar.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* REAL FEATURED EXPERIMENTS & LEARNING RESOURCES */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Start an Experiment Right Now
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Loaded directly from LabXAI’s verified experiment library.
            </p>
          </div>
          <Link to="/library" className="lab-btn-secondary text-xs">
            Browse Full Experiment Library <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {featuredLabs.map((exp) => {
            const disc = exp.discipline || exp.subject;
            const style = SUBJECT_COLORS[disc] || SUBJECT_COLORS.Physics;
            return (
              <div key={exp.id} className="lab-card-hover flex flex-col justify-between p-6">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={style.badge}>{disc}</Badge>
                    <Badge variant="default">
                      {exp.difficulty} · {exp.duration_minutes} {t('library.minutes')}
                    </Badge>
                  </div>
                  <h3 className="mt-3 text-lg font-extrabold text-slate-900 dark:text-white">
                    {getLocalizedField(exp, 'title', language)}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {getLocalizedField(exp, 'short_description', language)}
                  </p>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-slate-100 pt-4 dark:border-navy-800">
                  <Link to={`/lab/${exp.id}`} className="lab-btn-primary px-3.5 py-2 text-xs">
                    <FlaskConical className="h-3.5 w-3.5" />
                    {t('landing.openExperiment')}
                  </Link>
                  <Link to={`/quizzes?experiment=${exp.id}`} className="lab-btn-secondary px-3.5 py-2 text-xs">
                    <ClipboardList className="h-3.5 w-3.5 text-violet-600" />
                    {t('dashboard.takeQuiz')}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Learning Resource Quick Cards */}
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Link to="/videos" className="lab-card-hover flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300">
              <PlaySquare className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Educational Video Library</h3>
              <p className="mt-0.5 text-xs text-slate-500">Curated concept videos linked directly to LabXAI labs.</p>
            </div>
          </Link>

          <Link to="/quizzes" className="lab-card-hover flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Interactive Science Quizzes</h3>
              <p className="mt-0.5 text-xs text-slate-500">Test concepts with MCQ, True/False &amp; numerical problems.</p>
            </div>
          </Link>

          <Link to="/tutor" className="lab-card-hover flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-blue-600 dark:bg-blue-950 dark:text-sky-300">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">AI Science &amp; Math Tutor</h3>
              <p className="mt-0.5 text-xs text-slate-500">Ask questions via voice or text in 5 Indian languages.</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
