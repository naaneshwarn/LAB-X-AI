import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Search, Sparkles } from 'lucide-react';
import { labApi } from '../api/client';
import { useApp } from '../context/AppContext';
import VoiceInputButton from '../components/VoiceInputButton';
import PageHeader from '../components/ui/PageHeader';
import ExperimentCard from '../components/ExperimentCard';
import { EmptyState, ErrorState, LoadingState } from '../components/StatusStates';

const DISCIPLINES = ['all', 'Physics', 'Chemistry', 'Biology', 'Mathematics'];
const DIFFICULTIES = ['all', 'Basic', 'Intermediate', 'Advanced'];

export default function LibraryPage() {
  const { t } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const [experiments, setExperiments] = useState([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [subject, setSubject] = useState(searchParams.get('subject') || 'all');
  const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') || 'all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const paramSub = searchParams.get('subject');
    const paramDiff = searchParams.get('difficulty');
    if (paramSub) setSubject(paramSub);
    if (paramDiff) setDifficulty(paramDiff);
  }, [searchParams]);

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
    const timer = setTimeout(loadExperiments, 140);
    return () => clearTimeout(timer);
  }, [loadExperiments]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: subject === 'all' ? 'Experiments' : `${subject} Lab` },
        ]}
        title={subject === 'all' ? t('library.title') : `${subject} Virtual Laboratory`}
        subtitle={t('library.subtitle')}
        rightSlot={
          <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 font-mono text-xs font-extrabold text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-sky-300">
            {experiments.length} experiments
          </span>
        }
      />

      {/* Discipline Quick Tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {DISCIPLINES.map((disc) => (
          <button
            key={disc}
            type="button"
            onClick={() => setSubject(disc)}
            className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              subject.toLowerCase() === disc.toLowerCase()
                ? 'bg-navy-900 text-white shadow-sm dark:bg-blue-600'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-300'
            }`}
          >
            {disc === 'all' ? t('library.allSubjects') : disc}
          </button>
        ))}
      </div>

      {/* Search (with Voice) + Difficulty Filter */}
      <div className="lab-card mb-8 grid gap-3 p-4 sm:grid-cols-12">
        <div className="flex items-center gap-2 sm:col-span-7">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('library.searchPlaceholder')}
              className="lab-input pl-9"
            />
          </div>
          <VoiceInputButton
            size="sm"
            onTranscript={(txt) => setSearch(txt)}
            title="Voice search experiments"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:col-span-5 sm:justify-end">
          {DIFFICULTIES.map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setDifficulty(lvl)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                difficulty.toLowerCase() === lvl.toLowerCase()
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-navy-700 dark:bg-navy-950 dark:text-slate-300'
              }`}
            >
              {lvl === 'all' ? t('library.allDifficulties') : lvl}
            </button>
          ))}
        </div>
      </div>

      {/* STEM Engineering Challenges Banner */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50/80 via-orange-50/60 to-amber-50/80 p-4 dark:border-amber-900/60 dark:from-navy-900 dark:via-amber-950/30 dark:to-navy-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-amber-950 dark:text-amber-200">
              Interdisciplinary STEM Challenges Mode
            </h3>
            <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80">
              Apply scientific experiments to solve real-world problems: circuit guards, automated irrigation, seismic bridges, and water filtration.
            </p>
          </div>
        </div>
        <Link
          to="/challenges"
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-amber-700"
        >
          View 8 STEM Challenges <ArrowRight className="h-3.5 w-3.5" />
        </Link>
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
                setSearchParams({});
              }}
              className="lab-btn-secondary text-xs"
            >
              {t('library.resetFilters')}
            </button>
          }
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {experiments.map((exp) => (
            <ExperimentCard key={exp.id} exp={exp} />
          ))}
        </div>
      )}
    </div>
  );
}
