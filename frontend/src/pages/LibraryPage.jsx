import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, FlaskConical, Search } from 'lucide-react';
import { labApi } from '../api/client';
import { useApp } from '../context/AppContext';
import { Badge, EmptyState, ErrorState, LoadingState } from '../components/StatusStates';

export default function LibraryPage() {
  const { language, t } = useApp();
  const [experiments, setExperiments] = useState([]);
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadExperiments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await labApi.listExperiments({ subject, difficulty, search });
      setExperiments(data);
    } catch (err) {
      setError(err.message || 'Unable to load experiments.');
    } finally {
      setLoading(false);
    }
  }, [subject, difficulty, search]);

  useEffect(() => {
    const timer = setTimeout(loadExperiments, 160);
    return () => clearTimeout(timer);
  }, [loadExperiments]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy-900 dark:text-white sm:text-3xl">
          {t('library.title')}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t('library.subtitle')}</p>
      </div>

      {/* Search & Filters */}
      <div className="lab-card mb-8 grid gap-3 p-4 sm:grid-cols-12">
        <div className="relative sm:col-span-6">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('library.searchPlaceholder')}
            className="lab-input pl-9"
          />
        </div>
        <div className="sm:col-span-3">
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="lab-input"
            aria-label="Filter by subject"
          >
            <option value="all">{t('library.allSubjects')}</option>
            <option value="Electricity">Physics - Electricity</option>
            <option value="Mechanics">Physics - Mechanics</option>
            <option value="Kinematics">Physics - Kinematics</option>
            <option value="Optics">Physics - Optics</option>
          </select>
        </div>
        <div className="sm:col-span-3">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="lab-input"
            aria-label="Filter by difficulty"
          >
            <option value="all">{t('library.allDifficulties')}</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingState message={t('common.loading')} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadExperiments} />
      ) : experiments.length === 0 ? (
        <EmptyState
          title={t('library.empty')}
          action={
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSubject('all');
                setDifficulty('all');
              }}
              className="lab-btn-secondary text-xs"
            >
              {t('library.resetFilters')}
            </button>
          }
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {experiments.map((exp) => {
            const objectives = language === 'kn' ? exp.objectives_kn : exp.objectives;
            return (
              <article key={exp.id} className="lab-card flex flex-col justify-between p-6">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="blue">{exp.subject}</Badge>
                    <div className="flex items-center gap-2">
                      <Badge variant={exp.difficulty === 'Beginner' ? 'emerald' : 'violet'}>
                        {exp.difficulty}
                      </Badge>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        {exp.duration_minutes} {t('library.minutes')}
                      </span>
                    </div>
                  </div>

                  <h2 className="mt-3 text-xl font-bold text-navy-900 dark:text-white">
                    {language === 'kn' ? exp.title_kn : exp.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {language === 'kn' ? exp.short_description_kn : exp.short_description}
                  </p>

                  <div className="mt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {t('library.objectives')}
                    </h3>
                    <ul className="mt-2 space-y-1.5">
                      {objectives.slice(0, 3).map((obj) => (
                        <li
                          key={obj}
                          className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300"
                        >
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 dark:border-navy-800">
                  <Link to={`/lab/${exp.id}`} className="lab-btn-primary">
                    <FlaskConical className="h-4 w-4" />
                    {t('library.startExperiment')}
                  </Link>
                  <Link to={`/quizzes?experiment=${exp.id}`} className="lab-btn-secondary">
                    {t('dashboard.takeQuiz')}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
