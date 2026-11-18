import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, FlaskConical } from 'lucide-react';
import { labApi } from '../api/client';
import { useApp } from '../context/AppContext';
import { getLocalizedField, SUBJECT_COLORS } from '../i18n/translations';
import { runMultidisciplinarySimulation } from '../simulations/engines';
import AiTutorPanel from '../components/AiTutorPanel';
import { Badge, LoadingState } from '../components/StatusStates';

export default function AiTutorPage() {
  const { language, t } = useApp();
  const [experiments, setExperiments] = useState([]);
  const [subject, setSubject] = useState('Physics');
  const [selectedExpId, setSelectedExpId] = useState('ohms-law');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    labApi
      .listExperiments()
      .then((data) => {
        setExperiments(data);
        if (data.length > 0 && !data.find((e) => e.id === selectedExpId)) {
          setSelectedExpId(data[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => experiments.filter((e) => e.discipline === subject),
    [experiments, subject]
  );

  const activeExp = useMemo(
    () => experiments.find((e) => e.id === selectedExpId) || filtered[0] || null,
    [experiments, filtered, selectedExpId]
  );

  const simContext = useMemo(() => {
    if (!activeExp) return { parameters: {}, measurements: {} };
    try {
      const res = runMultidisciplinarySimulation(activeExp.id, {});
      return { parameters: res.parameters || {}, measurements: res.measurements || {} };
    } catch {
      return { parameters: {}, measurements: {} };
    }
  }, [activeExp]);

  if (loading) return <LoadingState message={t('common.loading')} />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          <Bot className="h-4 w-4" /> Multilingual Voice &amp; Text Tutoring
        </div>
        <h1 className="mt-1 text-2xl font-extrabold text-navy-900 dark:text-white sm:text-3xl">
          {t('nav.tutor')}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Select any experiment across Physics, Chemistry, Biology, or Mathematics to ask questions via voice or text in 5 languages.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Experiment Context Picker */}
        <div className="space-y-4 lg:col-span-4">
          <div className="lab-card p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              1. Select Discipline
            </p>
            <div className="grid grid-cols-2 gap-2">
              {['Physics', 'Chemistry', 'Biology', 'Mathematics'].map((disc) => (
                <button
                  key={disc}
                  type="button"
                  onClick={() => {
                    setSubject(disc);
                    const first = experiments.find((e) => e.discipline === disc);
                    if (first) setSelectedExpId(first.id);
                  }}
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                    subject === disc
                      ? 'bg-navy-900 text-white dark:bg-blue-600'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-navy-700 dark:bg-navy-950 dark:text-slate-200'
                  }`}
                >
                  {disc}
                </button>
              ))}
            </div>

            <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              2. Select Experiment Context
            </p>
            <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
              {filtered.map((exp) => (
                <button
                  key={exp.id}
                  type="button"
                  onClick={() => setSelectedExpId(exp.id)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition ${
                    activeExp?.id === exp.id
                      ? 'border-blue-600 bg-blue-50 font-bold text-navy-900 dark:bg-blue-950/60 dark:text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-navy-800 dark:bg-navy-900 dark:text-slate-300'
                  }`}
                >
                  <span className="truncate pr-2">{getLocalizedField(exp, 'title', language)}</span>
                  <Badge variant="default">{exp.difficulty}</Badge>
                </button>
              ))}
            </div>
          </div>

          {activeExp && (
            <div className="lab-card p-4">
              <Badge variant={(SUBJECT_COLORS[activeExp.discipline] || SUBJECT_COLORS.Physics).badge}>
                {activeExp.discipline} · {activeExp.difficulty}
              </Badge>
              <h2 className="mt-2 text-sm font-bold text-navy-900 dark:text-white">
                {getLocalizedField(activeExp, 'title', language)}
              </h2>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                {getLocalizedField(activeExp, 'short_description', language)}
              </p>
              <Link to={`/lab/${activeExp.id}`} className="lab-btn-secondary mt-3 w-full text-xs">
                <FlaskConical className="h-3.5 w-3.5" />
                Open Interactive Simulation
              </Link>
            </div>
          )}
        </div>

        {/* Right Full AI Tutor Workspace */}
        <div className="lg:col-span-8">
          {activeExp && (
            <AiTutorPanel
              experimentId={activeExp.id}
              parameters={simContext.parameters}
              measurements={simContext.measurements}
            />
          )}
        </div>
      </div>
    </div>
  );
}
