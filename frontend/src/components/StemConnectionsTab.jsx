import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Atom,
  Briefcase,
  Check,
  CheckCircle2,
  Code2,
  Compass,
  Copy,
  Cpu,
  Globe2,
  Layers,
  Lightbulb,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { getStemConnections } from '../data/stemConnectionsData';

export default function StemConnectionsTab({ experimentId, discipline }) {
  const data = getStemConnections(experimentId, discipline);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (data.microcontrollerSnippet?.code) {
      navigator.clipboard.writeText(data.microcontrollerSnippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 via-indigo-50/60 to-purple-50 p-5 dark:border-navy-700 dark:from-navy-900 dark:via-blue-950/40 dark:to-indigo-950/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Compass className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-navy-900 dark:text-white">
                  Interdisciplinary STEM Connections
                </h3>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-extrabold text-blue-700 dark:bg-blue-900/60 dark:text-sky-300">
                  S · T · E · M
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                How scientific inquiry, digital technology, engineering design, and mathematical rigor unite on this topic.
              </p>
            </div>
          </div>
          <Link
            to="/challenges"
            className="lab-btn-primary inline-flex items-center gap-1.5 py-2 text-xs font-bold"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Explore STEM Challenges
          </Link>
        </div>
      </div>

      {/* 4 Pillars of STEM Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Science */}
        <div className="rounded-2xl border border-blue-200/80 bg-white p-4 shadow-sm dark:border-blue-900/50 dark:bg-navy-900">
          <div className="mb-2.5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Atom className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                1. Science (Natural Phenomena)
              </h4>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
            {data.science}
          </p>
        </div>

        {/* Technology */}
        <div className="rounded-2xl border border-emerald-200/80 bg-white p-4 shadow-sm dark:border-emerald-900/50 dark:bg-navy-900">
          <div className="mb-2.5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                2. Technology (Sensors & Telemetry)
              </h4>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
            {data.technology}
          </p>
        </div>

        {/* Engineering */}
        <div className="rounded-2xl border border-amber-200/80 bg-white p-4 shadow-sm dark:border-amber-900/50 dark:bg-navy-900">
          <div className="mb-2.5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <Wrench className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                3. Engineering (Design & Systems)
              </h4>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
            {data.engineering}
          </p>
        </div>

        {/* Mathematics */}
        <div className="rounded-2xl border border-purple-200/80 bg-white p-4 shadow-sm dark:border-purple-900/50 dark:bg-navy-900">
          <div className="mb-2.5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                4. Mathematics (Equations & Quantitative Modeling)
              </h4>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
            {data.mathematics}
          </p>
        </div>
      </div>

      {/* Real-World Case Study Card */}
      {data.realWorldCaseStudy && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-navy-800 dark:bg-navy-900">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-navy-800">
            <div className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-blue-600" />
              <h4 className="text-sm font-bold text-navy-900 dark:text-white">
                Industry Case Study: {data.realWorldCaseStudy.title}
              </h4>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-navy-800 dark:text-slate-300">
              {data.realWorldCaseStudy.industry}
            </span>
          </div>

          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            {data.realWorldCaseStudy.description}
          </p>

          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-blue-700 dark:text-sky-300">
            <Briefcase className="h-3.5 w-3.5 shrink-0" />
            <span>Target Career Path: {data.realWorldCaseStudy.career}</span>
          </div>
        </div>
      )}

      {/* Virtual Microcontroller & Sensor Instrumentation */}
      {data.microcontrollerSnippet && (
        <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm dark:border-navy-800">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Applied Technology: {data.microcontrollerSnippet.title}
              </h4>
              <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-300">
                {data.microcontrollerSnippet.platform}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-300 transition hover:bg-slate-700 hover:text-white"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>

          <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 font-mono text-[11px] leading-relaxed text-emerald-300/90">
            <code>{data.microcontrollerSnippet.code}</code>
          </pre>
          <p className="mt-2 text-[11px] text-slate-400">
            Connect an ESP32 or Arduino board in your school science lab to reproduce this virtual measurement with real sensors!
          </p>
        </div>
      )}
    </div>
  );
}
