import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Compass,
  FileText,
  FlaskConical,
  Languages,
  ListChecks,
  PlaySquare,
  RotateCcw,
  Save,
  ShieldAlert,
  Sliders,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { labApi } from '../api/client';
import { useApp } from '../context/AppContext';
import {
  getLocalizedField,
  LANGUAGE_METADATA,
  localizeClientParamError,
  RESULT_SECTION_LABELS,
  SUBJECT_COLORS,
} from '../i18n/translations';
import {
  CHART_CONFIG_BY_EXPERIMENT,
  runMultidisciplinarySimulation,
} from '../simulations/engines';
import OhmsLawVisualizer from '../simulations/OhmsLawVisualizer';
import PendulumVisualizer from '../simulations/PendulumVisualizer';
import ProjectileVisualizer from '../simulations/ProjectileVisualizer';
import ConvexLensVisualizer from '../simulations/ConvexLensVisualizer';
import AiTutorPanel from '../components/AiTutorPanel';
import NarrationControls from '../components/NarrationControls';
import VideoPlayerCard from '../components/VideoPlayerCard';
import VoiceInputButton from '../components/VoiceInputButton';
import { Badge, EmptyState, ErrorState, LoadingState } from '../components/StatusStates';
import StemConnectionsTab from '../components/StemConnectionsTab';
import StemPredictSection from '../components/StemPredictSection';
import StemReportExport from '../components/StemReportExport';
import StemCollabModal from '../components/StemCollabModal';
import { getStemConnections } from '../data/stemConnectionsData';

const PhysicsExtraVisualizer = lazy(() => import('../simulations/visualizers/PhysicsExtraVisualizer'));
const ChemistryVisualizer = lazy(() => import('../simulations/visualizers/ChemistryVisualizer'));
const BiologyVisualizer = lazy(() => import('../simulations/visualizers/BiologyVisualizer'));
const MathVisualizer = lazy(() => import('../simulations/visualizers/MathVisualizer'));

const ORIGINAL_PHYSICS_IDS = new Set([
  'ohms-law',
  'simple-pendulum',
  'projectile-motion',
  'convex-lens',
]);

export default function VirtualLabPage() {
  const { experimentId = 'ohms-law' } = useParams();
  const navigate = useNavigate();
  const { language, studentId, addToast, t } = useApp();

  const [experiment, setExperiment] = useState(null);
  const [siblingExperiments, setSiblingExperiments] = useState([]);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [params, setParams] = useState({});
  const [notes, setNotes] = useState('');
  const [observations, setObservations] = useState([]);
  const [activeDocTab, setActiveDocTab] = useState('instructions');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // On-demand translated theory & instructions state
  const [translatedTheory, setTranslatedTheory] = useState(null);
  const [translatingTheory, setTranslatingTheory] = useState(false);
  const [translatedInstructions, setTranslatedInstructions] = useState(null);
  const [translatingInstructions, setTranslatingInstructions] = useState(false);

  // Live backend localized result explanation state (never resets params on language switch!)
  const [localizedSim, setLocalizedSim] = useState(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [explanationError, setExplanationError] = useState('');
  const [showEnglishOriginal, setShowEnglishOriginal] = useState(false);
  const [explanationRetryTick, setExplanationRetryTick] = useState(0);
  const [tutorPrompt, setTutorPrompt] = useState(null);
  const [stemReportOpen, setStemReportOpen] = useState(false);
  const [collabModalOpen, setCollabModalOpen] = useState(false);

  const handleAskTutor = useCallback((question, context = null) => {
    setTutorPrompt({ id: Date.now(), question, context });
  }, []);

  const sessionStartRef = useRef(Date.now());

  // Note: Do NOT put `language` in dependencies so switching language preserves live simulation parameters!
  const loadExperiment = useCallback(async () => {
    setLoading(true);
    setError('');
    setTranslatedTheory(null);
    sessionStartRef.current = Date.now();
    try {
      const detail = await labApi.getExperiment(experimentId);
      setExperiment(detail);
      const defaults = {};
      (detail.parameters_schema || []).forEach((spec) => {
        defaults[spec.name] = spec.default;
      });
      setParams(defaults);
      setObservations([]);
      setNotes('');

      const disc = detail.discipline || detail.subject;
      const [siblings, vids] = await Promise.all([
        labApi.listExperiments({ subject: disc }).catch(() => []),
        labApi
          .getVideoRecommendations({ experimentId, subject: disc, limit: 3 })
          .catch(() => []),
      ]);
      setSiblingExperiments(siblings);
      setRelatedVideos(vids);
    } catch (err) {
      setError(err.message || 'Failed to load experiment metadata.');
    } finally {
      setLoading(false);
    }
  }, [experimentId]);

  useEffect(() => {
    loadExperiment();
  }, [loadExperiment]);

  // Clear translated previews if language changes (NEVER resets simulation params!)
  useEffect(() => {
    setTranslatedTheory(null);
    setTranslatedInstructions(null);
    setShowEnglishOriginal(false);
  }, [language]);

  // Deterministic live computation (independent of AI, zero latency for SVG/Chart)
  const { simResult, paramError } = useMemo(() => {
    if (!experiment || Object.keys(params).length === 0) {
      return { simResult: null, paramError: '' };
    }
    try {
      return { simResult: runMultidisciplinarySimulation(experimentId, params), paramError: '' };
    } catch (err) {
      return { simResult: null, paramError: err.message };
    }
  }, [experiment, experimentId, params]);

  // Fetch authoritative backend localized explanation whenever experimentId, params, or language changes
  useEffect(() => {
    if (!experiment || Object.keys(params).length === 0 || paramError) {
      return undefined;
    }
    let cancelled = false;
    setLoadingExplanation(true);
    setExplanationError('');

    const timer = setTimeout(async () => {
      try {
        const res = await labApi.simulateExperiment(experimentId, {
          studentId,
          parameters: params,
          language,
          saveRun: false,
        });
        if (!cancelled) {
          setLocalizedSim(res);
          setExplanationError('');
        }
      } catch (err) {
        if (!cancelled) {
          setLocalizedSim(null);
          setExplanationError(err.message || 'Unable to generate localized explanation.');
        }
      } finally {
        if (!cancelled) {
          setLoadingExplanation(false);
        }
      }
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [experiment, experimentId, params, language, paramError, studentId, explanationRetryTick]);

  const handleParamChange = useCallback((name, rawValue) => {
    const val = parseFloat(rawValue);
    if (!Number.isNaN(val)) {
      setParams((prev) => ({ ...prev, [name]: val }));
    }
  }, []);

  const handleReset = () => {
    if (experiment?.parameters_schema) {
      const defaults = {};
      experiment.parameters_schema.forEach((spec) => {
        defaults[spec.name] = spec.default;
      });
      setParams(defaults);
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
      const elapsedSeconds = Math.max(
        10,
        Math.round((Date.now() - sessionStartRef.current) / 1000)
      );
      const saved = await labApi.simulateExperiment(experimentId, {
        studentId,
        parameters: params,
        language,
        saveRun: true,
        notes,
        durationSeconds: elapsedSeconds,
      });
      setLocalizedSim(saved);
      setObservations((prev) => [
        {
          id: saved.run_id || Date.now(),
          timestamp: new Date(saved.created_at).toLocaleTimeString(),
          parameters: saved.parameters,
          measurements: saved.measurements,
        },
        ...prev,
      ]);
      sessionStartRef.current = Date.now();
      addToast('Observation verified by backend and saved to student history.', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to save observation.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTranslateTheory = async () => {
    if (!experiment) return;
    const targetLang = language === 'en' ? 'kn' : language;
    setTranslatingTheory(true);
    try {
      const res = await labApi.translateText({
        text: experiment.theory,
        sourceLang: 'en',
        targetLang,
        preserveScientificTerms: true,
      });
      setTranslatedTheory(res);
    } catch (err) {
      addToast(err.message || 'Translation failed.', 'error');
    } finally {
      setTranslatingTheory(false);
    }
  };

  const handleTranslateInstructions = async () => {
    if (!experiment?.instructions?.length) return;
    const targetLang = language === 'en' ? 'kn' : language;
    setTranslatingInstructions(true);
    try {
      const joined = experiment.instructions.map((s, idx) => `${idx + 1}. ${s}`).join('\n');
      const res = await labApi.translateText({
        text: joined,
        sourceLang: 'en',
        targetLang,
        preserveScientificTerms: true,
      });
      setTranslatedInstructions(res);
    } catch (err) {
      addToast(err.message || 'Translation failed.', 'error');
    } finally {
      setTranslatingInstructions(false);
    }
  };

  const renderVisualizer = () => {
    if (!simResult || !experiment) return null;

    if (ORIGINAL_PHYSICS_IDS.has(experimentId)) {
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
    }

    const discipline = experiment.discipline || experiment.subject;
    return (
      <Suspense fallback={<LoadingState message="Loading interactive visualizer..." />}>
        {discipline === 'Physics' && (
          <PhysicsExtraVisualizer
            experimentId={experimentId}
            params={params}
            measurements={simResult.measurements}
          />
        )}
        {discipline === 'Chemistry' && (
          <ChemistryVisualizer
            experimentId={experimentId}
            params={params}
            measurements={simResult.measurements}
            onParamChange={handleParamChange}
            onAskTutor={handleAskTutor}
          />
        )}
        {discipline === 'Biology' && (
          <BiologyVisualizer
            experimentId={experimentId}
            params={params}
            measurements={simResult.measurements}
            onParamChange={handleParamChange}
            onAskTutor={handleAskTutor}
          />
        )}
        {discipline === 'Mathematics' && (
          <MathVisualizer
            experimentId={experimentId}
            params={params}
            measurements={simResult.measurements}
          />
        )}
      </Suspense>
    );
  };

  const renderChart = () => {
    if (!simResult?.series_data?.length) return null;
    const cfg = CHART_CONFIG_BY_EXPERIMENT[experimentId];
    if (!cfg) return null;

    const isBar = cfg.type === 'bar';

    return (
      <div className="lab-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-navy-900 dark:text-white">{t('lab.chart')}</h3>
            <p className="text-xs text-slate-500">
              {cfg.yLabel} vs. {cfg.xLabel}
            </p>
          </div>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-500 dark:bg-navy-800 dark:text-slate-300">
            Deterministic Model Output
          </span>
        </div>
        <div className="mt-3 h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {isBar ? (
              <BarChart data={simResult.series_data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey={cfg.xKey} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                {cfg.y2Key && <Legend wrapperStyle={{ fontSize: '11px' }} />}
                <Bar dataKey={cfg.yKey} name={cfg.yKey} fill={cfg.color} radius={[5, 5, 0, 0]} />
                {cfg.y2Key && (
                  <Bar dataKey={cfg.y2Key} name={cfg.y2Key} fill="#64748b" radius={[5, 5, 0, 0]} />
                )}
              </BarChart>
            ) : (
              <LineChart data={simResult.series_data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey={cfg.xKey} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                {cfg.y2Key && <Legend wrapperStyle={{ fontSize: '11px' }} />}
                <Line
                  type="monotone"
                  dataKey={cfg.yKey}
                  name={cfg.yKey}
                  stroke={cfg.color}
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                />
                {cfg.y2Key && (
                  <Line
                    type="monotone"
                    dataKey={cfg.y2Key}
                    name={cfg.y2Key}
                    stroke="#64748b"
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    dot={false}
                  />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  if (loading) return <LoadingState message={t('common.loading')} />;
  if (error) return <ErrorState message={error} onRetry={loadExperiment} />;
  if (!experiment) return null;

  const discipline = experiment.discipline || experiment.subject;
  const themeStyle = SUBJECT_COLORS[discipline] || SUBJECT_COLORS.Physics;
  const title = getLocalizedField(experiment, 'title', language);
  const shortDesc = getLocalizedField(experiment, 'short_description', language);
  const theory = getLocalizedField(experiment, 'theory', language);
  const objectives =
    (language === 'kn' && experiment.objectives_kn?.length
      ? experiment.objectives_kn
      : experiment.objectives) || [];
  const instructions =
    (language === 'kn' && experiment.instructions_kn?.length
      ? experiment.instructions_kn
      : experiment.instructions) || [];

  const relatedExpObjects = (experiment.related_experiments || [])
    .map((relId) => siblingExperiments.find((e) => e.id === relId))
    .filter(Boolean);

  const hasGravityParam = (experiment.parameters_schema || []).some((p) => p.name === 'gravity');

  const targetLangMeta =
    LANGUAGE_METADATA.find((l) => l.code === (language === 'en' ? 'kn' : language)) ||
    LANGUAGE_METADATA[1];

  const resultLabels = RESULT_SECTION_LABELS[language] || RESULT_SECTION_LABELS.en;
  const activeExplanation =
    localizedSim && localizedSim.language === language ? localizedSim.explanation : null;
  const displayMeasurements =
    localizedSim &&
    localizedSim.language === language &&
    localizedSim.formatted_measurements?.length
      ? localizedSim.formatted_measurements
      : simResult?.formatted_measurements || [];

  const localizedNarrationText =
    activeExplanation && activeExplanation.translation_available
      ? [
          activeExplanation.summary,
          activeExplanation.observation,
          activeExplanation.formula_explanation,
          activeExplanation.conclusion,
        ]
          .filter(Boolean)
          .join(' ')
      : language === 'en'
      ? simResult?.conclusion_summary || ''
      : '';

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Top Subject Switcher & Quick Links */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Link
            to={`/library?subject=${encodeURIComponent(discipline)}`}
            className="font-semibold text-slate-600 hover:text-navy-900 dark:text-slate-300 dark:hover:text-white"
          >
            ← {discipline} Library
          </Link>
          <span className="text-slate-400">/</span>
          <select
            value={experimentId}
            onChange={(e) => navigate(`/lab/${e.target.value}`)}
            aria-label="Switch experiment within subject"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy-900 dark:border-navy-700 dark:bg-navy-900 dark:text-white"
          >
            {siblingExperiments.length > 0 ? (
              siblingExperiments.map((item) => (
                <option key={item.id} value={item.id}>
                  [{item.difficulty}] {getLocalizedField(item, 'title', language)}
                </option>
              ))
            ) : (
              <option value={experimentId}>{title}</option>
            )}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/quizzes?experiment=${experimentId}`} className="lab-btn-secondary text-xs">
            <ClipboardList className="h-4 w-4 text-violet-600" />
            {t('lab.takeExperimentQuiz')}
          </Link>
        </div>
      </div>

      {/* Title Banner + Narration */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={themeStyle.badge}>{discipline}</Badge>
            <Badge
              variant={
                experiment.difficulty === 'Basic'
                  ? 'emerald'
                  : experiment.difficulty === 'Intermediate'
                  ? 'amber'
                  : 'violet'
              }
            >
              {experiment.difficulty}
            </Badge>
            {experiment.topic && <Badge variant="default">{experiment.topic}</Badge>}
            <span className="text-xs text-slate-500">
              {experiment.duration_minutes} {t('library.minutes')}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold text-navy-900 dark:text-white sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {shortDesc}
          </p>
        </div>
        <NarrationControls
          text={localizedNarrationText || `${title}. ${shortDesc}`}
        />
      </div>

      {/* Virtual Simulation Safety / Model Disclaimer */}
      {experiment.safety_note && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <span className="font-bold">Virtual Model & Safety Notice: </span>
            {experiment.safety_note}
          </div>
        </div>
      )}

      {/* Core Workspace Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left/Center Column */}
        <div className="space-y-6 lg:col-span-8">
          {/* Interactive Visualizer */}
          {renderVisualizer()}

          {/* STEM Critical Thinking: Predict-Before-Run Engine */}
          <StemPredictSection
            experimentId={experiment.id}
            discipline={discipline}
            lastSimResult={simResult}
            onPredictionConfirmed={(isCorrect) => {
              addToast(
                isCorrect
                  ? 'Great prediction! Critical thinking skill increased.'
                  : 'Observation verified! Scientific inquiry points updated.',
                isCorrect ? 'success' : 'info'
              );
            }}
          />

          {/* Controls Card */}
          <div className="lab-card p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base font-bold text-navy-900 dark:text-white">
                <Sliders className={`h-4 w-4 ${themeStyle.accent}`} />
                {t('lab.controls')}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                {hasGravityParam && (
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
                <button
                  type="button"
                  onClick={handleReset}
                  className="lab-btn-secondary px-3 py-1.5 text-xs"
                >
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
                {localizeClientParamError(paramError, language)}
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              {(experiment.parameters_schema || []).map((spec) => (
                <div key={spec.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label
                      htmlFor={`param-${spec.name}`}
                      className="font-semibold text-slate-700 dark:text-slate-200"
                    >
                      {spec.label}
                    </label>
                    <span className={`font-mono font-bold ${themeStyle.accent}`}>
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

          {/* Live Computed Measurements & Structured Localized Explanation */}
          {simResult && (
            <div className="lab-card p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-base font-bold text-navy-900 dark:text-white">
                  <FlaskConical className={`h-4 w-4 ${themeStyle.accent}`} />
                  {t('lab.measurements')}
                </h2>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-slate-600 dark:bg-navy-800 dark:text-slate-300">
                  {language.toUpperCase()} · Deterministic Math
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {displayMeasurements.map((item) => (
                  <div
                    key={item.key}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-navy-700 dark:bg-navy-950"
                  >
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-0.5 font-mono text-base font-bold text-navy-900 dark:text-white">
                      {item.value} {item.unit}
                    </p>
                  </div>
                ))}
              </div>

              {/* Dynamic Multilingual Result Explanation Panel */}
              <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 dark:border-navy-700 dark:bg-navy-950/60">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 dark:border-navy-800">
                  <div className="flex items-center gap-2">
                    <Languages className={`h-4 w-4 ${themeStyle.accent}`} />
                    <h3 className="text-sm font-bold text-navy-900 dark:text-white">
                      {resultLabels.panelTitle}
                    </h3>
                    {loadingExplanation && (
                      <span className="animate-pulse text-[11px] font-medium text-blue-600 dark:text-blue-400">
                        {resultLabels.loading}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {localizedNarrationText && (
                      <NarrationControls text={localizedNarrationText} compact />
                    )}
                    {language !== 'en' && (
                      <button
                        type="button"
                        onClick={() => setShowEnglishOriginal((v) => !v)}
                        className="rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-navy-700 dark:text-slate-300 dark:hover:bg-navy-800"
                      >
                        {showEnglishOriginal ? resultLabels.hideEnglish : resultLabels.showEnglish}
                      </button>
                    )}
                  </div>
                </div>

                {/* Case 1: Backend error or explicit translation unavailable (never silently pretend English is regional!) */}
                {explanationError || (activeExplanation && !activeExplanation.translation_available) ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <div className="flex-1">
                        <p className="font-bold">{resultLabels.unavailableTitle}</p>
                        <p className="mt-0.5">
                          {activeExplanation?.error_notice || explanationError}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExplanationRetryTick((n) => n + 1)}
                        className="shrink-0 rounded-md border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-navy-900 dark:text-amber-200"
                      >
                        {resultLabels.retry}
                      </button>
                    </div>

                    {showEnglishOriginal && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-200">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          English Original (Not Translated)
                        </p>
                        <p>
                          {activeExplanation?.english_original?.summary ||
                            simResult.conclusion_summary}
                        </p>
                      </div>
                    )}
                  </div>
                ) : activeExplanation ? (
                  <div className="space-y-2.5 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                    <div className={`rounded-lg border px-3.5 py-2.5 ${themeStyle.border} ${themeStyle.bg}`}>
                      <span className="font-bold text-navy-900 dark:text-white">
                        {resultLabels.summary}:{' '}
                      </span>
                      {activeExplanation.summary}
                    </div>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3 dark:border-navy-800 dark:bg-navy-900/50">
                        <p className="font-bold text-navy-900 dark:text-white">
                          {resultLabels.observation}
                        </p>
                        <p className="mt-1">{activeExplanation.observation}</p>
                      </div>
                      <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3 dark:border-navy-800 dark:bg-navy-900/50">
                        <p className="font-bold text-navy-900 dark:text-white">
                          {resultLabels.formula}
                        </p>
                        <p className="mt-1 font-mono text-[11px] leading-relaxed">
                          {activeExplanation.formula_explanation}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3 dark:border-navy-800 dark:bg-navy-900/50">
                        <p className="font-bold text-navy-900 dark:text-white">
                          {resultLabels.interpretation}
                        </p>
                        <p className="mt-1">{activeExplanation.interpretation}</p>
                      </div>
                      <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3 dark:border-navy-800 dark:bg-navy-900/50">
                        <p className="font-bold text-navy-900 dark:text-white">
                          {resultLabels.application}
                        </p>
                        <p className="mt-1">{activeExplanation.real_world_application}</p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3.5 py-2.5 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                      <span className="font-bold text-emerald-900 dark:text-emerald-300">
                        {resultLabels.conclusion}:{' '}
                      </span>
                      {activeExplanation.conclusion}
                    </div>

                    {showEnglishOriginal && language !== 'en' && activeExplanation.english_original?.summary && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-300">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          English Reference Original
                        </p>
                        <p>
                          <strong>Summary:</strong> {activeExplanation.english_original.summary}
                        </p>
                        <p className="mt-1">
                          <strong>Formula:</strong> {activeExplanation.english_original.formula_explanation}
                        </p>
                        <p className="mt-1">
                          <strong>Conclusion:</strong> {activeExplanation.english_original.conclusion}
                        </p>
                      </div>
                    )}
                  </div>
                ) : language === 'en' ? (
                  <div
                    className={`rounded-lg border px-4 py-3 text-xs leading-relaxed text-navy-900 dark:text-slate-100 ${themeStyle.border} ${themeStyle.bg}`}
                  >
                    <span className="font-bold">{resultLabels.conclusion}: </span>
                    {simResult.conclusion_summary}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">{resultLabels.loading}</p>
                )}
              </div>
            </div>
          )}

          {/* Analytical Chart */}
          {renderChart()}

          {/* Observation Table + Student Notes */}
          <div className="lab-card p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold text-navy-900 dark:text-white">
                {t('lab.resultsTable')}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCollabModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                >
                  <Users className="h-3.5 w-3.5" />
                  STEM Team Project
                </button>
                <button
                  type="button"
                  onClick={() => setStemReportOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-sky-100 dark:border-blue-800 dark:bg-blue-950/60 dark:text-sky-300"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Export STEM Report
                </button>
              </div>
            </div>
            <div className="mb-4">
              <div className="mb-1 flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {t('lab.observationsNotes')}
                </label>
                <VoiceInputButton
                  size="sm"
                  onTranscript={(spoken) =>
                    setNotes((prev) => (prev ? `${prev} ${spoken}` : spoken))
                  }
                  title="Dictate observation notes"
                />
              </div>
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
                            .filter(([, v]) => v !== null && typeof v !== 'boolean' && typeof v !== 'object')
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

            {/* Live Data Trend Analysis */}
            {observations.length >= 2 && (
              <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/70 p-3.5 text-xs dark:border-blue-900/60 dark:bg-blue-950/40">
                <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-sky-200">
                  <Sparkles className="h-4 w-4 text-blue-600 dark:text-sky-400" />
                  <span>STEM Data Trend Analysis ({observations.length} Recorded Trials)</span>
                </div>
                <p className="mt-1 leading-relaxed text-slate-700 dark:text-slate-300">
                  Comparing initial trial ({observations[observations.length - 1].timestamp}) with latest trial ({observations[0].timestamp}):
                  Inputs moved from{' '}
                  <span className="font-mono font-semibold">
                    {Object.entries(observations[observations.length - 1].parameters).map(([k, v]) => `${k}=${v}`).join(', ')}
                  </span>{' '}
                  to{' '}
                  <span className="font-mono font-semibold">
                    {Object.entries(observations[0].parameters).map(([k, v]) => `${k}=${v}`).join(', ')}
                  </span>
                  . Live calculations confirm predictable mathematical response with zero simulated deviation.
                </p>
              </div>
            )}
          </div>

          {/* Complete Lab Manual Tabs (Procedure, Theory + Translate, Objectives/Apparatus, Applications/Mistakes, STEM Connections) */}
          <div className="lab-card p-5">
            <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3 dark:border-navy-800">
              {[
                { key: 'instructions', label: t('lab.instructions'), icon: ListChecks },
                { key: 'theory', label: t('lab.theory'), icon: BookOpen },
                { key: 'stemConnections', label: 'STEM Connections', icon: Compass },
                { key: 'apparatus', label: `${t('lab.objectives')} & ${t('lab.apparatus')}`, icon: Wrench },
                { key: 'applications', label: `${t('lab.applications')} & Mistakes`, icon: Compass },
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
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <NarrationControls
                    text={
                      translatedInstructions?.translated_text ||
                      instructions.join('. ')
                    }
                    compact
                  />
                  <button
                    type="button"
                    onClick={handleTranslateInstructions}
                    disabled={translatingInstructions}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                  >
                    <Languages className="h-3.5 w-3.5" />
                    {translatingInstructions
                      ? 'Translating...'
                      : `Translate Steps → ${targetLangMeta.nativeName}`}
                  </button>
                </div>
                <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-200">
                  {instructions.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                {translatedInstructions && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs dark:border-blue-900 dark:bg-blue-950/40">
                    <p className="mb-1.5 font-bold text-blue-800 dark:text-blue-300">
                      Translated Procedure ({translatedInstructions.target_lang.toUpperCase()}) · Provider:{' '}
                      {translatedInstructions.provider}
                    </p>
                    <p className="whitespace-pre-line leading-relaxed text-navy-900 dark:text-slate-100">
                      {translatedInstructions.translated_text}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeDocTab === 'theory' && (
              <div className="space-y-4 text-sm text-slate-700 dark:text-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Scientific Theory
                  </p>
                  <button
                    type="button"
                    onClick={handleTranslateTheory}
                    disabled={translatingTheory}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                  >
                    <Languages className="h-3.5 w-3.5" />
                    {translatingTheory
                      ? 'Translating...'
                      : `${t('lab.translateContent')} → ${targetLangMeta.nativeName}`}
                  </button>
                </div>

                <p className="leading-relaxed">{theory}</p>

                {translatedTheory && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs dark:border-blue-900 dark:bg-blue-950/40">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="font-bold text-blue-800 dark:text-blue-300">
                        Translated Theory ({translatedTheory.target_lang.toUpperCase()}) · Provider:{' '}
                        {translatedTheory.provider}
                      </span>
                      {translatedTheory.preserved_tokens?.length > 0 && (
                        <span className="font-mono text-[10px] text-slate-500">
                          Preserved symbols: {translatedTheory.preserved_tokens.slice(0, 4).join(', ')}
                        </span>
                      )}
                    </div>
                    <p className="leading-relaxed text-navy-900 dark:text-slate-100">
                      {translatedTheory.translated_text}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Required Formulas & Equations
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(experiment.formulas || []).map((f) => (
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
                    {(experiment.assumptions || []).map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeDocTab === 'stemConnections' && (
              <StemConnectionsTab
                experimentId={experiment.id}
                discipline={discipline}
              />
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
                    {(experiment.apparatus || []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeDocTab === 'applications' && (
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    {t('lab.applications')}
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-200">
                    {(experiment.real_world_applications || []).map((app) => (
                      <li key={app} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                        <span>{app}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    {t('lab.commonMistakes')}
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-200">
                    {(experiment.common_mistakes || []).map((mistake) => (
                      <li key={mistake} className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                        <span>{mistake}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Verified Educational Videos Section (Always present on every experiment) */}
          <div className="lab-card p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base font-bold text-navy-900 dark:text-white">
                <PlaySquare className={`h-4 w-4 ${themeStyle.accent}`} />
                {t('lab.videosSection')}
              </h2>
              <Link
                to={`/videos?subject=${encodeURIComponent(discipline)}`}
                className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                Browse Full Video Library →
              </Link>
            </div>
            {relatedVideos.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {relatedVideos.slice(0, 2).map((video) => (
                  <VideoPlayerCard key={video.id} video={video} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No verified video directly mapped yet"
                description={`Explore verified ${discipline} lectures and concept walkthroughs in the Video Library.`}
                action={
                  <Link
                    to={`/videos?subject=${encodeURIComponent(discipline)}`}
                    className="lab-btn-secondary text-xs"
                  >
                    Open {discipline} Videos
                  </Link>
                }
              />
            )}
          </div>

          {/* Related Experiments & Quiz CTA */}
          {relatedExpObjects.length > 0 && (
            <div className="lab-card p-5">
              <h2 className="mb-3 text-base font-bold text-navy-900 dark:text-white">
                {t('lab.relatedExperiments')}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {relatedExpObjects.map((rel) => (
                  <Link
                    key={rel.id}
                    to={`/lab/${rel.id}`}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5 transition hover:border-blue-400 hover:bg-white dark:border-navy-700 dark:bg-navy-950 dark:hover:bg-navy-800"
                  >
                    <div>
                      <p className="text-xs font-bold text-navy-900 dark:text-white">
                        {getLocalizedField(rel, 'title', language)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {rel.discipline || rel.subject} · {rel.difficulty}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Context-Aware AI Science & Math Tutor */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-20">
            <AiTutorPanel
              experimentId={experimentId}
              parameters={simResult?.parameters || params}
              measurements={simResult?.measurements || {}}
              pendingPrompt={tutorPrompt}
            />
          </div>
        </div>
      </div>

      {/* STEM Report Export Modal */}
      <StemReportExport
        open={stemReportOpen}
        onClose={() => setStemReportOpen(false)}
        experiment={experiment}
        parameters={simResult?.parameters || params}
        measurements={simResult?.measurements || {}}
        observations={observations}
        notes={notes}
        studentId={studentId}
        stemData={getStemConnections(experiment.id, discipline)}
      />

      {/* STEM Collaborative Team Project Modal */}
      <StemCollabModal
        open={collabModalOpen}
        onClose={() => setCollabModalOpen(false)}
        experimentId={experiment.id}
        experimentTitle={getLocalizedField(experiment, 'title', language)}
      />
    </div>
  );
}
