import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Award, FlaskConical, Printer } from 'lucide-react';
import { labApi } from '../api/client';
import { useApp } from '../context/AppContext';
import { SUBJECT_COLORS } from '../i18n/translations';
import { Badge, EmptyState, ErrorState, LoadingState } from '../components/StatusStates';

export default function HistoryPage() {
  const { studentId, t } = useApp();
  const [history, setHistory] = useState(null);
  const [progress, setProgress] = useState(null);
  const [activeTab, setActiveTab] = useState('runs');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [hist, prog] = await Promise.all([
        labApi.getStudentHistory(studentId),
        labApi.getStudentProgress(studentId),
      ]);
      setHistory(hist);
      setProgress(prog);
    } catch (err) {
      setError(err.message || 'Unable to load learning history.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  if (loading) return <LoadingState message={t('common.loading')} />;
  if (error) return <ErrorState message={error} onRetry={loadHistory} />;
  if (!history || !progress) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 dark:text-white sm:text-3xl">
            {t('history.title')}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t('history.subtitle')}</p>
        </div>
        <button type="button" onClick={() => window.print()} className="lab-btn-secondary text-xs">
          <Printer className="h-4 w-4" />
          {t('history.exportReport')}
        </button>
      </div>

      {/* Teacher-friendly summary banner */}
      <div className="lab-card mb-6 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <p className="text-xs text-slate-500">Student</p>
          <p className="text-sm font-bold text-navy-900 dark:text-white">{progress.student.name}</p>
          <p className="text-xs text-slate-500">
            {progress.student.grade_level} · {progress.current_learning_level}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Experiments Completed</p>
          <p className="font-mono text-xl font-bold text-navy-900 dark:text-white">
            {progress.experiments_completed} / {progress.total_experiments_available}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Saved Lab Runs</p>
          <p className="font-mono text-xl font-bold text-blue-600">
            {history.simulation_runs.length}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Average Quiz Score</p>
          <p className="font-mono text-xl font-bold text-emerald-600">
            {progress.quizzes_attempted > 0 ? `${progress.average_quiz_score}%` : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Time & Streak</p>
          <p className="font-mono text-xl font-bold text-orange-600">
            {progress.time_spent_minutes}m · {progress.learning_streak_days}d
          </p>
        </div>
      </div>

      {/* Subject-wise Report Row */}
      {progress.subject_progress?.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          {progress.subject_progress.map((sp) => {
            const style = SUBJECT_COLORS[sp.subject] || SUBJECT_COLORS.Physics;
            return (
              <div key={sp.subject} className="lab-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-navy-900 dark:text-white">
                    {sp.subject}
                  </span>
                  <Badge variant={style.badge}>{sp.completion_percentage}%</Badge>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  {sp.completed_experiments}/{sp.total_experiments} labs · {sp.total_runs} runs
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { id: 'runs', label: `${t('history.simRunsTab')} (${history.simulation_runs.length})`, icon: FlaskConical },
          { id: 'quizzes', label: `${t('history.quizAttemptsTab')} (${history.quiz_attempts.length})`, icon: Award },
          { id: 'activity', label: `${t('history.activityTab')} (${history.recent_activities.length})`, icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-navy-900 text-white dark:bg-blue-600'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'runs' && (
        history.simulation_runs.length === 0 ? (
          <EmptyState
            title={t('history.noRuns')}
            action={
              <Link to="/subjects" className="lab-btn-primary text-xs">
                Launch an Experiment
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {history.simulation_runs.map((run) => {
              const style = SUBJECT_COLORS[run.discipline] || SUBJECT_COLORS.Physics;
              return (
                <div key={run.id} className="lab-card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={style.badge}>{run.discipline || 'Physics'}</Badge>
                      <Badge variant="default">{run.difficulty || 'Basic'}</Badge>
                      <h3 className="text-base font-bold text-navy-900 dark:text-white">
                        {run.experiment_title}
                      </h3>
                      <Badge variant="emerald">Completed</Badge>
                    </div>
                    <span className="font-mono text-xs text-slate-500">
                      {new Date(run.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-slate-50 p-3 dark:bg-navy-950">
                      <p className="text-[11px] font-semibold uppercase text-slate-500">Parameters</p>
                      <p className="mt-1 font-mono text-xs text-slate-800 dark:text-slate-200">
                        {Object.entries(run.parameters)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(' · ')}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3 dark:bg-navy-950">
                      <p className="text-[11px] font-semibold uppercase text-slate-500">Computed Measurements</p>
                      <p className="mt-1 font-mono text-xs text-blue-700 dark:text-blue-300">
                        {Object.entries(run.measurements)
                          .filter(([, v]) => v !== null && typeof v !== 'boolean' && typeof v !== 'object')
                          .slice(0, 5)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(' · ')}
                      </p>
                    </div>
                  </div>
                  {run.notes && (
                    <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-semibold">Student Note:</span> {run.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {activeTab === 'quizzes' && (
        history.quiz_attempts.length === 0 ? (
          <EmptyState
            title={t('history.noQuizzes')}
            action={
              <Link to="/quizzes" className="lab-btn-primary text-xs">
                Browse Quizzes
              </Link>
            }
          />
        ) : (
          <div className="lab-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 dark:border-navy-800 dark:bg-navy-950">
                  <tr>
                    <th className="px-5 py-3">Quiz</th>
                    <th className="px-5 py-3">Score</th>
                    <th className="px-5 py-3">Percentage</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                  {history.quiz_attempts.map((att) => (
                    <tr key={att.id}>
                      <td className="px-5 py-3.5 font-semibold text-navy-900 dark:text-white">
                        {att.quiz_title}
                      </td>
                      <td className="px-5 py-3.5 font-mono">
                        {att.score} / {att.total_questions}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {att.percentage}%
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={att.passed ? 'emerald' : 'amber'}>
                          {att.passed ? 'Passed' : 'Needs Review'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                        {new Date(att.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {activeTab === 'activity' && (
        history.recent_activities.length === 0 ? (
          <EmptyState title="No learning activities recorded yet." />
        ) : (
          <div className="space-y-3">
            {history.recent_activities.map((act) => (
              <div key={act.id} className="lab-card flex flex-wrap items-center justify-between gap-2 p-4">
                <div>
                  <p className="text-sm font-bold text-navy-900 dark:text-white">{act.title}</p>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{act.summary}</p>
                </div>
                <span className="font-mono text-xs text-slate-500">
                  {new Date(act.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
