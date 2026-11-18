import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Atom,
  Award,
  BookOpen,
  Bot,
  Calculator,
  CheckCircle2,
  ClipboardList,
  Clock,
  Cpu,
  Dna,
  Flame,
  FlaskConical,
  GraduationCap,
  HeartPulse,
  History,
  PlaySquare,
  Sparkles,
  Star,
  Timer,
  Trophy,
  UserCheck,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { labApi } from '../api/client';
import { useApp } from '../context/AppContext';
import { SUBJECT_COLORS } from '../i18n/translations';
import { Badge, EmptyState, ErrorState, LoadingState } from '../components/StatusStates';

const SUBJECTS = ['all', 'Physics', 'Chemistry', 'Biology', 'Mathematics'];
const DIFFICULTIES = ['all', 'Basic', 'Intermediate', 'Advanced'];

const SUBJECT_META = {
  Physics: {
    icon: Atom,
    tagline: 'Circuits, motion, light & forces',
    bgCard: 'from-sky-50 to-blue-50/70 dark:from-blue-950/50 dark:to-navy-900',
    iconBg: 'bg-blue-600 text-white',
    starterLab: '/lab/ohms-law',
    badgeColor: '#2563EB',
  },
  Chemistry: {
    icon: FlaskConical,
    tagline: 'pH scale, atoms, reactions & lab bench',
    bgCard: 'from-green-50 to-emerald-50/70 dark:from-green-950/50 dark:to-navy-900',
    iconBg: 'bg-green-500 text-white',
    starterLab: '/lab/acids-bases-ph',
    badgeColor: '#22C55E',
  },
  Biology: {
    icon: Dna,
    tagline: 'Human body systems, cells & genetics',
    bgCard: 'from-rose-50 to-emerald-50/50 dark:from-rose-950/40 dark:to-navy-900',
    iconBg: 'bg-rose-500 text-white',
    starterLab: '/lab/human-respiratory-system',
    badgeColor: '#FB7185',
  },
  Mathematics: {
    icon: Calculator,
    tagline: 'Geometry, graphs, trig & calculus',
    bgCard: 'from-violet-50 to-purple-50/70 dark:from-violet-950/50 dark:to-navy-900',
    iconBg: 'bg-violet-500 text-white',
    starterLab: '/lab/trigonometric-functions',
    badgeColor: '#A78BFA',
  },
};

export default function DashboardPage() {
  const { studentId, language, t } = useApp();
  const [subject, setSubject] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [progress, setProgress] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [prog, hist] = await Promise.all([
        labApi.getStudentProgress(studentId, { subject, difficulty }),
        labApi.getStudentHistory(studentId),
      ]);
      setProgress(prog);
      setHistory(hist);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }, [studentId, subject, difficulty]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingState message={t('common.loading')} />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!progress) return null;

  const subjectChartData = (progress.subject_progress || []).map((sp) => ({
    name: sp.subject,
    completion: sp.completion_percentage,
    quizScore: sp.average_quiz_score ?? 0,
    runs: sp.total_runs,
    color: (SUBJECT_COLORS[sp.subject] || SUBJECT_COLORS.Physics).hex,
  }));

  const recommendedItems = (progress.per_experiment || []).filter((item) =>
    (progress.recommended_experiments || []).includes(item.experiment_id)
  );

  const hasAnyActivity =
    progress.total_simulation_runs > 0 || progress.quizzes_attempted > 0;

  const continueTarget = progress.recently_accessed?.[0] || null;
  const subjectsTried = (progress.subject_progress || []).filter((s) => s.total_runs > 0).length;

  const achievements = [
    {
      id: 'first-lab',
      title: 'First Lab Explorer',
      desc: 'Run your first virtual science experiment',
      earned: progress.total_simulation_runs >= 1,
      color: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
    },
    {
      id: 'quiz-whiz',
      title: 'Quiz Star',
      desc: 'Pass at least 1 science quiz',
      earned: progress.quizzes_passed >= 1,
      color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    },
    {
      id: 'multi-subject',
      title: 'All-Round Scientist',
      desc: 'Try labs in 2 or more subjects',
      earned: subjectsTried >= 2,
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    },
    {
      id: 'dedicated',
      title: '5-Experiment Streak',
      desc: 'Complete 5 simulation runs',
      earned: progress.total_simulation_runs >= 5,
      color: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800',
    },
  ];

  const earnedCount = achievements.filter((a) => a.earned).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Welcoming Student Banner */}
      <div className="rounded-3xl border border-sky-200 bg-gradient-to-r from-sky-50 via-white to-emerald-50 p-6 shadow-card dark:border-navy-800 dark:from-navy-900 dark:via-navy-900 dark:to-navy-950">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              Welcome back, {progress.student.name.split(' ')[0]}!
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
              {t('dashboard.title')}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Explore the human body, mix virtual chemicals safely, and build working circuits in the Physics Playground.
            </p>
          </div>

          {/* Student Profile Card */}
          <div className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm dark:border-navy-700 dark:bg-navy-950">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-sm">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {progress.student.name}
                </p>
                {progress.student.is_demo && (
                  <Badge variant="blue">{t('dashboard.demoBadge')}</Badge>
                )}
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {progress.student.grade_level} · {progress.current_learning_level} Learner
              </p>
            </div>
          </div>
        </div>

        {/* Continue Learning + Featured 2.0 Launchers */}
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <Link
            to={continueTarget ? `/lab/${continueTarget.experiment_id}` : '/lab/human-respiratory-system'}
            className="group flex flex-col justify-between rounded-2xl border border-blue-200 bg-blue-600 p-4 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold">
                Continue Learning
              </span>
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </div>
            <div className="mt-3">
              <p className="text-sm font-extrabold">
                {continueTarget
                  ? language === 'kn'
                    ? continueTarget.title_kn
                    : continueTarget.title
                  : 'Human Respiratory System'}
              </p>
              <p className="mt-0.5 text-xs text-blue-100">
                {continueTarget ? 'Pick up right where you left off' : 'Start interactive breathing lab'}
              </p>
            </div>
          </Link>

          <Link
            to="/playground"
            className="group flex flex-col justify-between rounded-2xl border border-orange-200 bg-orange-50 p-4 transition hover:-translate-y-0.5 hover:shadow-md dark:border-orange-900/50 dark:bg-orange-950/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white">
                <Cpu className="h-5 w-5" />
              </div>
              <Badge variant="orange">New 2.0</Badge>
            </div>
            <div className="mt-3">
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">Physics Playground</p>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                Build circuits, ramps &amp; light rays
              </p>
            </div>
          </Link>

          <Link
            to="/lab/human-respiratory-system"
            className="group flex flex-col justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 transition hover:-translate-y-0.5 hover:shadow-md dark:border-rose-900/50 dark:bg-rose-950/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500 text-white">
                <HeartPulse className="h-5 w-5" />
              </div>
              <Badge variant="rose">3D / 2D Body</Badge>
            </div>
            <div className="mt-3">
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">Human Body Lab</p>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                Lungs, heart, digestion &amp; reflexes
              </p>
            </div>
          </Link>

          <Link
            to="/lab/chemical-reaction-playground"
            className="group flex flex-col justify-between rounded-2xl border border-green-200 bg-green-50 p-4 transition hover:-translate-y-0.5 hover:shadow-md dark:border-green-900/50 dark:bg-green-950/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500 text-white">
                <FlaskConical className="h-5 w-5" />
              </div>
              <Badge variant="emerald">Virtual Bench</Badge>
            </div>
            <div className="mt-3">
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">Chemistry Lab Bench</p>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                Beakers, pH meter &amp; safe reactions
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Large Child-Friendly Subject Cards */}
      {progress.subject_progress?.length > 0 && (
        <div className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Explore Your Subjects
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pick a subject to start an interactive virtual experiment!
              </p>
            </div>
            <Link to="/library" className="text-xs font-bold text-blue-600 hover:underline dark:text-sky-400">
              Browse all experiments →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {progress.subject_progress.map((sp) => {
              const style = SUBJECT_COLORS[sp.subject] || SUBJECT_COLORS.Physics;
              const meta = SUBJECT_META[sp.subject] || SUBJECT_META.Physics;
              const Icon = meta.icon;
              return (
                <div
                  key={sp.subject}
                  className={`lab-card flex flex-col justify-between bg-gradient-to-br p-5 transition hover:-translate-y-0.5 hover:shadow-elevated ${meta.bgCard}`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm ${meta.iconBg}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant={style.badge}>{sp.completion_percentage}% done</Badge>
                    </div>
                    <h3 className="mt-3 text-base font-extrabold text-slate-900 dark:text-white">
                      {sp.subject}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                      {meta.tagline}
                    </p>
                    <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/80 dark:bg-navy-800">
                      <div
                        className={`h-full rounded-full transition-all ${style.bar}`}
                        style={{ width: `${Math.min(100, sp.completion_percentage)}%` }}
                      />
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <span>{sp.completed_experiments}/{sp.total_experiments} labs</span>
                      <span>Quiz: {sp.average_quiz_score !== null ? `${sp.average_quiz_score}%` : '—'}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link
                      to={`/library?subject=${encodeURIComponent(sp.subject)}`}
                      className="lab-btn-primary flex-1 py-2 text-xs"
                    >
                      Start Experiment
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Friendly KPI Strip + Achievements */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lab-card flex items-center gap-3.5 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">{t('dashboard.experimentsCompleted')}</p>
            <p className="font-mono text-xl font-extrabold text-slate-900 dark:text-white">
              {progress.experiments_completed} / {progress.total_experiments_available}
            </p>
          </div>
        </div>

        <div className="lab-card flex items-center gap-3.5 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">{t('dashboard.learningStreak')}</p>
            <p className="font-mono text-xl font-extrabold text-slate-900 dark:text-white">
              {progress.learning_streak_days} {progress.learning_streak_days === 1 ? 'day' : 'days'}
            </p>
          </div>
        </div>

        <div className="lab-card flex items-center gap-3.5 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">{t('dashboard.avgQuizScore')}</p>
            <p className="font-mono text-xl font-extrabold text-slate-900 dark:text-white">
              {progress.quizzes_attempted > 0 ? `${progress.average_quiz_score}%` : '—'}
            </p>
          </div>
        </div>

        <div className="lab-card flex items-center gap-3.5 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-blue-600 dark:bg-blue-950/60 dark:text-sky-400">
            <Timer className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">{t('dashboard.timeSpent')}</p>
            <p className="font-mono text-xl font-extrabold text-slate-900 dark:text-white">
              {progress.time_spent_minutes} min
            </p>
          </div>
        </div>
      </div>

      {/* Achievements & Badges Section */}
      <div className="lab-card mt-6 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
            <Trophy className="h-5 w-5 text-amber-500" />
            Achievements &amp; Badges
          </h2>
          <Badge variant="amber">{earnedCount} / {achievements.length} Earned</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`flex items-start gap-3 rounded-2xl border p-3.5 transition ${
                ach.earned
                  ? ach.color
                  : 'border-dashed border-slate-200 bg-slate-50/70 opacity-70 dark:border-navy-700 dark:bg-navy-950/50'
              }`}
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm dark:bg-navy-900">
                <Star className={`h-4 w-4 ${ach.earned ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
              </div>
              <div>
                <p className="text-xs font-extrabold">{ach.title}</p>
                <p className="mt-0.5 text-[11px] opacity-85">{ach.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subject & Difficulty Filters */}
      <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {SUBJECTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSubject(s)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                subject === s
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-sky-50 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-300'
              }`}
            >
              {s === 'all' ? t('library.allSubjects') : s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DIFFICULTIES.map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setDifficulty(lvl)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                difficulty === lvl
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-300'
              }`}
            >
              {lvl === 'all' ? t('library.allDifficulties') : lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Main Analytics + Recommended Next Steps */}
      <div className="mt-5 grid gap-6 lg:grid-cols-12">
        <div className="lab-card p-6 lg:col-span-7">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            Your Progress by Subject (%)
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Updated automatically whenever you save an observation or complete a quiz.
          </p>
          {!hasAnyActivity ? (
            <div className="mt-4">
              <EmptyState
                title="Ready to start your first lab?"
                description="Run a virtual experiment and save an observation, or complete a short quiz to see your subject progress chart."
                action={
                  <Link to="/lab/human-respiratory-system" className="lab-btn-primary text-xs">
                    Try Human Respiratory System
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectChartData} margin={{ top: 10, right: 16, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="completion" name="Completion (%)" radius={[8, 8, 0, 0]}>
                    {subjectChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6 lg:col-span-5">
          <div className="lab-card p-6">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              {t('dashboard.recommended')}
            </h2>
            <div className="mt-4 space-y-3">
              {recommendedItems.slice(0, 4).map((item) => {
                const style = SUBJECT_COLORS[item.discipline || item.subject] || SUBJECT_COLORS.Physics;
                return (
                  <div
                    key={item.experiment_id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-navy-700 dark:bg-navy-950"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Badge variant={style.badge}>{item.discipline || item.subject}</Badge>
                        <span className="text-[11px] font-semibold text-slate-500">{item.difficulty}</span>
                      </div>
                      <p className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-white">
                        {language === 'kn' ? item.title_kn : item.title}
                      </p>
                    </div>
                    <Link
                      to={`/lab/${item.experiment_id}`}
                      className="lab-btn-primary shrink-0 px-3 py-1.5 text-xs"
                    >
                      {t('dashboard.openLab')}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lab-card p-5">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              {t('dashboard.quickActions')}
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <Link to="/playground" className="lab-btn-secondary justify-start text-xs">
                <Cpu className="h-4 w-4 text-orange-500" />
                Physics Playground
              </Link>
              <Link to="/subjects" className="lab-btn-secondary justify-start text-xs">
                <BookOpen className="h-4 w-4 text-blue-600" />
                {t('nav.subjects')}
              </Link>
              <Link to="/tutor" className="lab-btn-secondary justify-start text-xs">
                <Bot className="h-4 w-4 text-green-600" />
                {t('nav.tutor')}
              </Link>
              <Link to="/quizzes" className="lab-btn-secondary justify-start text-xs">
                <ClipboardList className="h-4 w-4 text-violet-600" />
                {t('nav.quizzes')}
              </Link>
              <Link to="/videos" className="lab-btn-secondary justify-start text-xs">
                <PlaySquare className="h-4 w-4 text-rose-500" />
                {t('nav.videos')}
              </Link>
              <Link to="/history" className="lab-btn-secondary justify-start text-xs">
                <History className="h-4 w-4 text-sky-600" />
                {t('dashboard.viewHistory')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recently Accessed + Activity Feed */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="lab-card p-6">
          <h2 className="mb-4 text-base font-extrabold text-slate-900 dark:text-white">
            {t('dashboard.recentExperiments')}
          </h2>
          {progress.recently_accessed.length === 0 ? (
            <EmptyState
              title="No recent experiments yet"
              description={t('dashboard.noRecent')}
              action={
                <Link to="/subjects" className="lab-btn-primary text-xs">
                  {t('landing.ctaStart')}
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {progress.recently_accessed.map((item) => {
                const style = SUBJECT_COLORS[item.discipline || item.subject] || SUBJECT_COLORS.Physics;
                return (
                  <div
                    key={item.experiment_id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 dark:border-navy-700"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant={style.badge}>{item.discipline || item.subject}</Badge>
                        <span className="text-[11px] font-semibold text-slate-500">{item.difficulty}</span>
                      </div>
                      <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                        {language === 'kn' ? item.title_kn : item.title}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        {item.last_accessed ? new Date(item.last_accessed).toLocaleString() : '—'}
                      </p>
                    </div>
                    <Link
                      to={`/lab/${item.experiment_id}`}
                      className="lab-btn-secondary px-3 py-1.5 text-xs"
                    >
                      {t('dashboard.openLab')}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lab-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
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
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-navy-800 dark:bg-navy-950/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
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
