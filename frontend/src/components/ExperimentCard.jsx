import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock, FlaskConical } from 'lucide-react';
import { Badge } from './StatusStates';
import { getExperimentImage, FALLBACK_EXPERIMENT_IMAGE } from '../data/experimentImages';
import { getStemConnections } from '../data/stemConnectionsData';
import { getLocalizedField, SUBJECT_COLORS } from '../i18n/translations';
import { useApp } from '../context/AppContext';

export default function ExperimentCard({ exp }) {
  const { language, t } = useApp();
  const [imgError, setImgError] = useState(false);

  if (!exp) return null;

  const imgData = imgError ? FALLBACK_EXPERIMENT_IMAGE : getExperimentImage(exp.id);
  const colors = SUBJECT_COLORS[exp.discipline] || SUBJECT_COLORS.Physics;
  const objectives = language === 'kn' ? exp.objectives_kn : exp.objectives;

  const diffBadge =
    exp.difficulty === 'Basic' || exp.difficulty === 'Beginner'
      ? 'emerald'
      : exp.difficulty === 'Intermediate'
      ? 'amber'
      : 'rose';

  return (
    <article
      className={`group lab-card-hover flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:bg-navy-900 ${colors.border}`}
    >
      {/* Visual illustration / background header (approx 55-60% visual balance) */}
      <Link
        to={`/lab/${exp.id}`}
        aria-label={`Open simulation for ${getLocalizedField(exp, 'title', language)}`}
        className="relative block w-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        style={{
          aspectRatio: '16 / 10',
          backgroundColor: imgData.subjectBg || '#F8FAFC',
        }}
      >
        <img
          src={imgData.image}
          alt={imgData.alt}
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
          className={`h-full w-full select-none transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:transition-none ${
            imgData.fit === 'cover' ? 'object-cover' : 'object-contain p-3.5 sm:p-4'
          }`}
        />

        {/* Subtle hover gradient veil */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </Link>

      {/* Card Content & Details */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Badges & Meta */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant={colors.badge}>{exp.discipline}</Badge>
          <div className="flex items-center gap-1.5">
            <Badge variant={diffBadge}>{exp.difficulty}</Badge>
            {exp.duration_minutes && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <Clock className="h-3 w-3 shrink-0" />
                {exp.duration_minutes} {t('library.minutes')}
              </span>
            )}
          </div>
        </div>

        {/* Localized Title */}
        <h2 className="mt-3 text-base font-bold text-navy-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400 line-clamp-2">
          <Link to={`/lab/${exp.id}`}>
            {getLocalizedField(exp, 'title', language)}
          </Link>
        </h2>

        {/* Localized Description */}
        <p className="mt-1.5 text-xs leading-relaxed text-slate-600 line-clamp-2 dark:text-slate-300">
          {getLocalizedField(exp, 'short_description', language)}
        </p>

        {/* STEM Interdisciplinary Indicator */}
        <div className="mt-2.5 flex items-center gap-1 text-[10px] font-bold">
          <span className="rounded bg-sky-100 px-1.5 py-0.5 text-blue-700 dark:bg-blue-950 dark:text-sky-300" title="Science">S</span>
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" title="Technology">T</span>
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-700 dark:bg-amber-950 dark:text-amber-300" title="Engineering">E</span>
          <span className="rounded bg-purple-100 px-1.5 py-0.5 text-purple-700 dark:bg-purple-950 dark:text-purple-300" title="Mathematics">M</span>
          <span className="ml-1 text-[10px] font-medium text-slate-400">Interdisciplinary</span>
        </div>

        {/* Objectives preview */}
        {objectives?.length > 0 && (
          <ul className="mt-3 space-y-1">
            {objectives.slice(0, 1).map((obj) => (
              <li
                key={obj}
                className="flex items-start gap-1.5 text-[11px] text-slate-700 dark:text-slate-300"
              >
                <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-blue-600 dark:text-blue-400" />
                <span className="line-clamp-1">{obj}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Spacer to push actions to bottom for consistent card heights */}
        <div className="flex-1" />

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-navy-800">
          <Link
            to={`/lab/${exp.id}`}
            className="lab-btn-primary flex-1 justify-center py-2 text-xs font-semibold"
          >
            <FlaskConical className="h-3.5 w-3.5 shrink-0" />
            <span>{t('library.startExperiment')}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none" />
          </Link>
          <Link
            to={`/quizzes?experiment=${exp.id}`}
            className="lab-btn-secondary justify-center py-2 text-xs font-semibold"
          >
            {t('dashboard.takeQuiz')}
          </Link>
        </div>
      </div>
    </article>
  );
}
