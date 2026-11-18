import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PlaySquare, Search, Sparkles } from 'lucide-react';
import { labApi } from '../api/client';
import { useApp } from '../context/AppContext';
import VideoPlayerCard from '../components/VideoPlayerCard';
import VoiceInputButton from '../components/VoiceInputButton';
import { EmptyState, ErrorState, LoadingState } from '../components/StatusStates';

export default function VideoLibraryPage() {
  const { t } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const [videos, setVideos] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState(searchParams.get('subject') || 'all');
  const [experimentId, setExperimentId] = useState(searchParams.get('experiment') || 'all');
  const [difficulty, setDifficulty] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    labApi.listExperiments().then(setExperiments).catch(() => setExperiments([]));
  }, []);

  const loadVideos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await labApi.listVideos({
        subject,
        experimentId,
        difficulty,
        language: languageFilter,
        search,
      });
      setVideos(data);
    } catch (err) {
      setError(err.message || 'Unable to load educational videos.');
    } finally {
      setLoading(false);
    }
  }, [subject, experimentId, difficulty, languageFilter, search]);

  useEffect(() => {
    const timer = setTimeout(loadVideos, 150);
    return () => clearTimeout(timer);
  }, [loadVideos]);

  const featuredVideos = videos.filter((v) => v.featured);
  const filteredExperiments =
    subject === 'all'
      ? experiments
      : experiments.filter((e) => e.discipline?.toLowerCase() === subject.toLowerCase());

  const resetFilters = () => {
    setSearch('');
    setSubject('all');
    setExperimentId('all');
    setDifficulty('all');
    setLanguageFilter('all');
    setSearchParams({});
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          <PlaySquare className="h-4 w-4" /> Verified Educational Sources
        </div>
        <h1 className="mt-1 text-2xl font-extrabold text-navy-900 dark:text-white sm:text-3xl">
          {t('videos.title')}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t('videos.subtitle')}</p>
      </div>

      {/* Search + Multi-Filter Bar */}
      <div className="lab-card mb-8 grid gap-3 p-4 md:grid-cols-12">
        <div className="flex items-center gap-2 md:col-span-4">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('videos.searchPlaceholder')}
              className="lab-input pl-9"
            />
          </div>
          <VoiceInputButton
            size="sm"
            onTranscript={(txt) => setSearch(txt)}
            title="Voice search videos"
          />
        </div>

        <div className="md:col-span-2">
          <select
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setExperimentId('all');
            }}
            aria-label="Filter videos by subject"
            className="lab-input"
          >
            <option value="all">{t('library.allSubjects')}</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Biology">Biology</option>
            <option value="Mathematics">Mathematics</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            value={experimentId}
            onChange={(e) => setExperimentId(e.target.value)}
            aria-label="Filter videos by experiment"
            className="lab-input"
          >
            <option value="all">All Experiments</option>
            {filteredExperiments.map((exp) => (
              <option key={exp.id} value={exp.id}>
                {exp.title}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            aria-label="Filter videos by difficulty"
            className="lab-input"
          >
            <option value="all">{t('library.allDifficulties')}</option>
            <option value="Basic">Basic</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        <div className="md:col-span-1">
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            aria-label="Filter videos by language"
            className="lab-input px-2"
          >
            <option value="all">All Langs</option>
            <option value="en">English (EN)</option>
            <option value="kn">Kannada (KN)</option>
            <option value="hi">Hindi (HI)</option>
            <option value="te">Telugu (TE)</option>
            <option value="ta">Tamil (TA)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingState message={t('common.loading')} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadVideos} />
      ) : videos.length === 0 ? (
        <EmptyState
          title={t('videos.empty')}
          description="Only verified educational videos are listed. Reset filters to explore all available videos."
          action={
            <button type="button" onClick={resetFilters} className="lab-btn-secondary text-xs">
              {t('library.resetFilters')}
            </button>
          }
        />
      ) : (
        <div className="space-y-10">
          {featuredVideos.length > 0 && !search && experimentId === 'all' && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-navy-900 dark:text-white">
                <Sparkles className="h-4 w-4 text-amber-500" />
                {t('videos.featuredTitle')}
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featuredVideos.slice(0, 6).map((vid) => (
                  <VideoPlayerCard key={vid.id} video={vid} />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-4 text-lg font-bold text-navy-900 dark:text-white">
              {t('videos.allVideosTitle')} ({videos.length})
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {videos.map((vid) => (
                <VideoPlayerCard key={vid.id} video={vid} />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
