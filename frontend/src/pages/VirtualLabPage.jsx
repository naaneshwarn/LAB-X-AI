import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FlaskConical,
  ListChecks,
  RotateCcw,
  Save,
  Sliders,
  Wrench,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { labApi } from '../api/client';
import { useApp } from '../context/AppContext';
import { DEFAULT_PARAMETERS, runClientSimulation } from '../simulations/physics';
import OhmsLawVisualizer from '../simulations/OhmsLawVisualizer';
import PendulumVisualizer from '../simulations/PendulumVisualizer';
import ProjectileVisualizer from '../simulations/ProjectileVisualizer';
import ConvexLensVisualizer from '../simulations/ConvexLensVisualizer';
import AiTutorPanel from '../components/AiTutorPanel';
import NarrationControls from '../components/NarrationControls';
import { Badge, ErrorState, LoadingState } from '../components/StatusStates';

const EXPERIMENT_TABS = [
  { id: 'ohms-law', label: "Ohm's Law", labelKn: 'ಓಮ್ ನಿಯಮ' },
  { id: 'simple-pendulum', label: 'Simple Pendulum', labelKn: 'ಸರಳ ಲೋಲಕ' },
  { id: 'projectile-motion', label: 'Projectile Motion', labelKn: 'ಪ್ರಕ್ಷೇಪಕ ಚಲನೆ' },
  { id: 'convex-lens', label: 'Convex Lens', labelKn: 'ಪೀನ ಮಸೂರ' },
];

export default function VirtualLabPage() {
  const { experimentId = 'ohms-law' } = useParams();
  const navigate = useNavigate();
  const { language, studentId, addToast, t } = useApp();

  const [experiment, setExperiment] = useState(null);
  const [params, setParams] = useState(() => ({
    ...(DEFAULT_PARAMETERS[experimentId] || DEFAULT_PARAMETERS['ohms-law']),
  }));
  const [notes, setNotes] = useState('');
  const [observations, setObservations] = useState([]);
  const [activeDocTab, setActiveDocTab] = useState('instructions');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadExperiment = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const detail = await labApi.getExperiment(experimentId);
      setExperiment(detail);
      const defaults = {};
      detail.parameters_schema.forEach((spec) => {
        defaults[spec.name] = spec.default;
      });
      setParams(defaults);
      setObservations([]);
      setNotes('');
    } catch (err) {
      setError(err.message || 'Failed to load experiment metadata.');
    } finally {
      setLoading(false);
    }
  }, [experimentId]);

  useEffect(() => {
    loadExperiment();
  }, [loadExperiment]);

  // Deterministic live computation (independent of AI and zero-latency!)
  const { simResult, paramError } = useMemo(() => {
    try {
      return { simResult: runClientSimulation(experimentId, params), paramError: '' };
    } catch (err) {
      return { simResult: null, paramError: err.message };
    }
  }, [experimentId, params]);

  const handleParamChange = (name, rawValue) => {
    const val = parseFloat(rawValue);
    if (!Number.isNaN(val)) {
      setParams((prev) => ({ ...prev, [name]: val }));
    }
  };

  const handleReset = () => {
    if (experiment?.parameters_schema) {
      const defaults = {};
      experiment.parameters_schema.forEach((spec) => {
        defaults[spec.name] = spec.default;
      });
      setParams(defaults);
    } else {
      setParams({ ...(DEFAULT_PARAMETERS[experimentId] || {}) });
    }
    addToast('Simulation parameters reset to defaults.', 'info');
  };

  const handleSaveObservation = async () => {
    if (paramError) {
      addToast(paramError, 'error');
      return;
    }
    setSaving(true);
    try {
      const saved = await labApi.simulateExperiment(experimentId, {
        studentId,
        parameters: params,
        saveRun: true,
        notes,
      });
      setObservations((prev) => [
        {
          id: saved.run_id || Date.now(),
          timestamp: new Date(saved.created_at).toLocaleTimeString(),
          parameters: saved.parameters,
          measurements: saved.measurements,
        },
        ...prev,
      ]);
      addToast('Observation verified by backend and saved to student history.', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to save observation.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const renderVisualizer = () => {
    if (!simResult) return null;
    switch (experimentId) {
      case 'ohms-law':
        return <OhmsLawVisualizer measurements={simResult.measurements} />;
      case 'simple-pendulum':
        return <PendulumVisualizer measurements={simResult.measurements} />;
      case 'projectile-motion':
        return (
          <ProjectileVisualizer
            measurements={simResult.measurements}
            seriesData={simResult.series_data}
          />
        );
      case 'convex-lens':
        return <ConvexLensVisualizer measurements={simResult.measurements} />;
      default:
        return null;
    }
  };

  const renderChart = () => {
    if (!simResult?.series_data?.length) return null;
    const configByExp = {
      'ohms-law': { xKey: 'voltage', yKey: 'current', xLabel: 'Voltage (V)', yLabel: 'Current (A)', color: '#2563eb' },
      'simple-pendulum': { xKey: 'length', yKey: 'period', xLabel: 'Length (m)', yLabel: 'Period T (s)', color: '#6d28d9' },
      'projectile-motion': { xKey: 'x', yKey: 'y', xLabel: 'Horizontal Distance x (m)', yLabel: 'Height y (m)', color: '#0891b2' },
      'convex-lens': { xKey: 'object_distance', yKey: 'image_distance', xLabel: 'Object Distance |u| (cm)', yLabel: 'Image Position v (cm)', color: '#2563eb' },
    };
    const cfg = configByExp[experimentId];
    if (!cfg) return null;

    return (
      <div className="lab-card p-5">
        <h3 className="text-sm font-bold text-navy-900 dark:text-white">{t('lab.chart')}</h3>
        <p className="text-xs text-slate-500">
          {cfg.yLabel} vs. {cfg.xLabel}
        </p>
        <div className="mt-3 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={simResult.series_data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey={cfg.xKey} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey={cfg.yKey}
                name={cfg.yLabel}
                stroke={cfg.color}
                strokeWidth={2.5}
                dot={{ r: 2.5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  if (loading) return <LoadingState message={t('common.loading')} />;
  if (error) return <ErrorState message={error} onRetry={loadExperiment} />;
  if (!experiment) return null;

  const title = language === 'kn' ? experiment.title_kn : experiment.title;
  const theory = language === 'kn' ? experiment.theory_kn : experiment.theory;
  const objectives = language === 'kn' ? experiment.objectives_kn : experiment.objectives;
  const instructions = language === 'kn' ? experiment.instructions_kn : experiment.instructions;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Experiment Switcher Bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {EXPERIMENT_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigate(`/lab/${tab.id}`)}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                experimentId === tab.id
                  ? 'bg-navy-900 text-white shadow-sm dark:bg-blue-600'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-300'
              }`}
            >
              {language === 'kn' ? tab.labelKn : tab.label}
            </button>
          ))}
        </div>
        <Link to={`/quizzes?experiment=${experimentId}`} className="lab-btn-secondary text-xs">
          <ClipboardList className="h-4 w-4 text-violet-600" />
          {t('lab.takeExperimentQuiz')}
        </Link>
      </div>

      {/* Title Banner */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="blue">{experiment.subject}</Badge>
            <Badge variant="emerald">{experiment.difficulty}</Badge>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold text-navy-900 dark:text-white sm:text-3xl">
            {title}
          </h1>
        </div>
        <NarrationControls text={`${title}. ${theory} ${simResult?.conclusion_summary || ''}`} />
      </div>

      {/* Core Workspace Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left/Center Column: Simulation + Controls + Measurements + Chart + Table */}
        <div className="space-y-6 lg:col-span-8">
          {/* Interactive SVG Visualizer */}
          {renderVisualizer()}

          {/* Controls Card */}
          <div className="lab-card p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base font-bold text-navy-900 dark:text-white">
                <Sliders className="h-4 w-4 text-blue-600" />
                {t('lab.controls')}
              </h2>
              <div className="flex items-center gap-2">
                {(experimentId === 'simple-pendulum' || experimentId === 'projectile-motion') && (
                  <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 text-xs dark:bg-navy-950">
                    {[
                      { label: 'Earth', g: 9.81 },
                      { label: 'Moon', g: 1.62 },
                      { label: 'Mars', g: 3.71 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleParamChange('gravity', preset.g)}
                        className={`rounded px-2 py-0.5 font-medium transition ${
                          Math.abs((params.gravity ?? 9.81) - preset.g) < 0.05
                            ? 'bg-navy-900 text-white dark:bg-blue-600'
                            : 'text-slate-600 hover:text-navy-900 dark:text-slate-300'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                )}
                <button type="button" onClick={handleReset} className="lab-btn-secondary px-3 py-1.5 text-xs">
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t('lab.reset')}
                </button>
                <button
                  type="button"
                  onClick={handleSaveObservation}
                  disabled={saving || Boolean(paramError)}
                  className="lab-btn-accent px-3.5 py-1.5 text-xs"
                >
                  <Save className="h-3.5 w-3.5" />
                  {saving ? t('lab.saving') : t('lab.recordReading')}
                </button>
              </div>
            </div>

            {paramError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {paramError}
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              {experiment.parameters_schema.map((spec) => (
                <div key={spec.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor={`param-${spec.name}`} className="font-semibold text-slate-700 dark:text-slate-200">
                      {spec.label}
                    </label>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {params[spec.name]} {spec.unit}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      id={`param-${spec.name}`}
                      type="range"
                      min={spec.min}
                      max={spec.max}
                      step={spec.step}
                      value={params[spec.name] ?? spec.default}
                      onChange={(e) => handleParamChange(spec.name, e.target.value)}
                      className="lab-slider flex-1"
                    />
                    <input
                      type="number"
                      min={spec.min}
                      max={spec.max}
                      step={spec.step}
                      value={params[spec.name] ?? spec.default}
                      onChange={(e) => handleParamChange(spec.name, e.target.value)}
                      className="lab-input w-20 py-1 text-right font-mono text-xs"
                      aria-label={`${spec.label} numeric value`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Computed Measurements */}
          {simResult && (
            <div className="lab-card p-5">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-navy-900 dark:text-white">
                <FlaskConical className="h-4 w-4 text-blue-600" />
                {t('lab.measurements')}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {simResult.formatted_measurements.map((item) => (
                  <div
                    key={item.key}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-navy-700 dark:bg-navy-950"
                  >
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-0.5 font-mono text-lg font-bold text-navy-900 dark:text-white">
                      {item.value} {item.unit}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50/70 px-4 py-3 text-xs leading-relaxed text-navy-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
                <span className="font-bold">{t('lab.conclusion')}: </span>
                {simResult.conclusion_summary}
              </div>
            </div>
          )}

          {/* Analytical Chart */}
          {renderChart()}

          {/* Observation Table + Student Notes */}
          <div className="lab-card p-5">
            <h2 className="mb-3 text-base font-bold text-navy-900 dark:text-white">
              {t('lab.resultsTable')}
            </h2>
            <div className="mb-4">
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                {t('lab.observationsNotes')}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('lab.notesPlaceholder')}
                className="lab-input text-xs"
              />
            </div>

            {observations.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-xs text-slate-500 dark:border-navy-700">
                {t('lab.noReadingsYet')}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 dark:border-navy-700">
                      <th className="py-2 pr-3">#</th>
                      <th className="py-2 pr-3">Time</th>
                      <th className="py-2 pr-3">Parameters</th>
                      <th className="py-2">Key Outputs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                    {observations.map((obs, idx) => (
                      <tr key={obs.id}>
                        <td className="py-2 pr-3 font-mono font-semibold">
                          {observations.length - idx}
                        </td>
                        <td className="py-2 pr-3 font-mono text-slate-500">{obs.timestamp}</td>
                        <td className="py-2 pr-3 font-mono">
                          {Object.entries(obs.parameters)
                            .map(([k, v]) => `${k}=${v}`)
                            .join(', ')}
                        </td>
                        <td className="py-2 font-mono text-blue-700 dark:text-blue-300">
                          {Object.entries(obs.measurements)
                            .filter(([, v]) => v !== null && typeof v !== 'boolean')
                            .slice(0, 4)
                            .map(([k, v]) => `${k}=${v}`)
                            .join(' | ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Lab Manual Documentation Tabs */}
          <div className="lab-card p-5">
            <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3 dark:border-navy-800">
              {[
                { key: 'instructions', label: t('lab.instructions'), icon: ListChecks },
                { key: 'theory', label: t('lab.theory'), icon: BookOpen },
                { key: 'apparatus', label: `${t('lab.objectives')} & ${t('lab.apparatus')}`, icon: Wrench },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveDocTab(tab.key)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      activeDocTab === tab.key
                        ? 'bg-navy-900 text-white dark:bg-blue-600'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-navy-800'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {activeDocTab === 'instructions' && (
              <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-200">
                {instructions.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            )}

            {activeDocTab === 'theory' && (
              <div className="space-y-4 text-sm text-slate-700 dark:text-slate-200">
                <p className="leading-relaxed">{theory}</p>
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Key Equations
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {experiment.formulas.map((f) => (
                      <code
                        key={f}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs text-navy-900 dark:border-navy-700 dark:bg-navy-950 dark:text-blue-300"
                      >
                        {f}
                      </code>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                    {t('lab.assumptions')}
                  </h4>
                  <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600 dark:text-slate-300">
                    {experiment.assumptions.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeDocTab === 'apparatus' && (
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    {t('lab.objectives')}
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-200">
                    {objectives.map((o) => (
                      <li key={o} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        <span>{o}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    {t('lab.apparatus')}
                  </h4>
                  <ul className="list-disc space-y-1.5 pl-4 text-xs text-slate-700 dark:text-slate-200">
                    {experiment.apparatus.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Context-Aware AI Science Tutor */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-20">
            <AiTutorPanel
              experimentId={experimentId}
              parameters={simResult?.parameters || params}
              measurements={simResult?.measurements || {}}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
