import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Atom, Calculator, Dna, FlaskConical } from 'lucide-react';
import { labApi } from '../api/client';
import { useApp } from '../context/AppContext';
import { getLocalizedField, SUBJECT_COLORS } from '../i18n/translations';
import PageHeader from '../components/ui/PageHeader';
import { Badge, ErrorState, LoadingState } from '../components/StatusStates';

const ICON_MAP = {
  Atom,
  FlaskConical,
  Dna,
  Calculator,
};

export default function SubjectsPage() {
  const { language, t } = useApp();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSubjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await labApi.listSubjects();
      setSubjects(data);
    } catch (err) {
      setError(err.message || 'Unable to load subjects.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  if (loading) return <LoadingState message={t('common.loading')} />;
  if (error) return <ErrorState message={error} onRetry={loadSubjects} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Subjects' }]}
        title={t('subjects.title')}
        subtitle={t('subjects.subtitle')}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {subjects.map((subj) => {
          const Icon = ICON_MAP[subj.icon] || Atom;
          const colors = SUBJECT_COLORS[subj.name] || SUBJECT_COLORS.Physics;
          const localName = getLocalizedField(subj, 'name', language);
          const localDesc = getLocalizedField(subj, 'description', language);

          return (
            <article
              key={subj.id}
              className={`lab-card-hover flex flex-col justify-between overflow-hidden border-t-4 p-6 ${colors.border}`}
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.bg} ${colors.accent}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <Badge variant={colors.badge}>
                    {subj.experiment_count} {t('subjects.experimentsCount')}
                  </Badge>
                </div>

                <h2 className="mt-4 text-xl font-extrabold text-navy-900 dark:text-white">
                  {localName}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {localDesc}
                </p>

                {/* Difficulty Level Distribution */}
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {['Basic', 'Intermediate', 'Advanced'].map((lvl) => (
                    <Link
                      key={lvl}
                      to={`/library?subject=${encodeURIComponent(subj.name)}&difficulty=${encodeURIComponent(lvl)}`}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center transition hover:border-blue-400 hover:bg-blue-50/50 dark:border-navy-700 dark:bg-navy-950"
                    >
                      <span className="block font-mono text-base font-extrabold text-navy-900 dark:text-white">
                        {subj.level_counts?.[lvl] ?? 0}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {lvl}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 dark:border-navy-800">
                <Link
                  to={`/library?subject=${encodeURIComponent(subj.name)}`}
                  className="lab-btn-primary text-xs"
                >
                  {t('subjects.exploreSubject')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to={`/videos?subject=${encodeURIComponent(subj.name)}`}
                  className="lab-btn-secondary text-xs"
                >
                  {t('nav.videos')}
                </Link>
                <Link
                  to={`/quizzes?subject=${encodeURIComponent(subj.name)}`}
                  className="lab-btn-secondary text-xs"
                >
                  {t('nav.quizzes')}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
