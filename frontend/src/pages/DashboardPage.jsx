import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Clock,
  FlaskConical,
  History,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { labApi } from '../api/client';
import { useApp } from '../context/AppContext';
import { Badge, EmptyState, ErrorState, LoadingState } from '../components/StatusStates';

export default function DashboardPage() {
  const { studentId, language, t } = useApp();
  const [progress, setProgress] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [prog, hist] = await Promise.all([
        labApi.getStudentProgress(studentId),
        labApi.getStudentHistory(studentId),
      ]);
      setProgress(prog);
      setHistory(hist);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingState message={t('common.loading')} />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!progress) return null;

  const chartData = progress.per_experiment.map((item) => ({
    name: item.experiment_id.replace('-', ' '),
    runs: item.runs_count,
    quizScore: item.best_quiz_percentage ?? 0,
  }));

  const recommendedItems = progress.per_experiment.filter((item) =>
    progress.recommended_experiments.includes(item.experiment_id)
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header & Student Identity */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 dark:text-white sm:text-3xl">
            {t('dashboard.title')}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <div className="lab-card flex items-center gap-3 px-4 py-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-900 text-white dark:bg-blue-600">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-navy-900 dark:text-white">
                {progress.student.name}
              </p>
              {progress.student.is_demo && <Badge variant="blue">{t('dashboard.demoBadge')}</Badge>}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {progress.student.grade_level}
            </p>
          </div>
        </div>
      </div>

      {/* Real KPI Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lab-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t('dashboard.experimentsCompleted')}
            </span>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-2 font-mono text-3xl font-bold text-navy-900 dark:text-white">
            {progress.experiments_completed} / {progress.total_experiments_available}
          </p>
        </div>

        <div className="lab-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t('dashboard.simulationRuns')}
            </span>
            <FlaskConical className="h-5 w-5 text-blue-600" />
          </div>
          <p className="mt-2 font-mono text-3xl font-bold text-navy-900 dark:text-white">
            {progress.total_simulation_runs}
          </p>
        </div>

        <div className="lab-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t('dashboard.avgQuizScore')}
            </span>
            <Award className="h-5 w-5 text-violet-600" />
          </div>
          <p className="mt-2 font-mono text-3xl font-bold text-navy-900 dark:text-white">
            {progress.quizzes_attempted > 0 ? `${progress.average_quiz_score}%` : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {progress.quizzes_passed} / {progress.quizzes_attempted} quizzes passed
          </p>
        </div>

        <div className="lab-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t('dashboard.overallProgress')}
            </span>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <p className="mt-2 font-mono text-3xl font-bold text-navy-900 dark:text-white">
            {progress.overall_completion_percentage}%
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-navy-800">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${Math.min(100, progress.overall_completion_percentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        {/* Experiment Mastery Chart */}
        <div className="lab-card p-6 lg:col-span-7">
          <h2 className="text-base font-bold text-navy-900 dark:text-white">
            Experiment Performance Overview (Best Quiz % by Lab)
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Reflects real quiz attempts stored in SQLite.
          </p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="quizScore" name="Best Quiz (%)" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recommended Experiments & Quick Nav */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          <div className="lab-card p-6">
            <h2 className="text-base font-bold text-navy-900 dark:text-white">
              {t('dashboard.recommended')}
            </h2>
            <div className="mt-4 space-y-3">
              {recommendedItems.slice(0, 3).map((item) => (
                <div
                  key={item.experiment_id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-navy-700 dark:bg-navy-950"
                >
                  <div>
                    <p className="text-sm font-semibold text-navy-900 dark:text-white">
                      {language === 'kn' ? item.title_kn : item.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      Runs: {item.runs_count} · Best Quiz:{' '}
                      {item.best_quiz_percentage !== null ? `${item.best_quiz_percentage}%` : 'Not attempted'}
                    </p>
                  </div>
                  <Link to={`/lab/${item.experiment_id}`} className="lab-btn-primary px-3 py-1.5 text-xs">
                    {t('dashboard.openLab')}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="lab-card p-6">
            <h2 className="text-base font-bold text-navy-900 dark:text-white">
              {t('dashboard.quickActions')}
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <Link to="/library" className="lab-btn-secondary justify-start text-xs">
                <BookOpen className="h-4 w-4 text-blue-600" />
                {t('nav.library')}
              </Link>
              <Link to="/quizzes" className="lab-btn-secondary justify-start text-xs">
                <ClipboardList className="h-4 w-4 text-violet-600" />
                {t('nav.quizzes')}
              </Link>
              <Link to="/history" className="lab-btn-secondary justify-start text-xs">
                <History className="h-4 w-4 text-emerald-600" />
                {t('dashboard.viewHistory')}
              </Link>
              <Link to="/lab/ohms-law" className="lab-btn-secondary justify-start text-xs">
                <FlaskConical className="h-4 w-4 text-blue-600" />
                {t('nav.lab')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recently Accessed + Activity Feed */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="lab-card p-6">
          <h2 className="mb-4 text-base font-bold text-navy-900 dark:text-white">
            {t('dashboard.recentExperiments')}
          </h2>
          {progress.recently_accessed.length === 0 ? (
            <EmptyState
              title="No lab activity yet"
              description={t('dashboard.noRecent')}
              action={
                <Link to="/library" className="lab-btn-primary text-xs">
                  {t('landing.ctaStart')}
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {progress.recently_accessed.map((item) => (
                <div
                  key={item.experiment_id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3.5 dark:border-navy-700"
                >
                  <div>
                    <p className="text-sm font-semibold text-navy-900 dark:text-white">
                      {language === 'kn' ? item.title_kn : item.title}
                    </p>
                    <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5" />
                      {item.last_accessed ? new Date(item.last_accessed).toLocaleString() : '—'}
                    </p>
                  </div>
                  <Link to={`/lab/${item.experiment_id}`} className="lab-btn-secondary px-3 py-1.5 text-xs">
                    {t('dashboard.openLab')}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lab-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-navy-900 dark:text-white">
            <Activity className="h-4 w-4 text-blue-600" />
            {t('dashboard.recentActivity')}
          </h2>
          {!history?.recent_activities?.length ? (
            <EmptyState
              title="No recorded activities"
              description="Save a simulation observation or submit a quiz to build your learning log."
            />
          ) : (
            <ul className="space-y-3">
              {history.recent_activities.slice(0, 6).map((act) => (
                <li
                  key={act.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-navy-800 dark:bg-navy-950/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-navy-900 dark:text-white">
                      {act.title}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(act.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{act.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
