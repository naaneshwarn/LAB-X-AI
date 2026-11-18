import React, { useEffect, useState } from 'react';
import { Clock, ExternalLink, FileText, Globe, Languages, Play, Subtitles } from 'lucide-react';
import { labApi } from '../api/client';
import { useApp } from '../context/AppContext';
import { LANGUAGE_METADATA, SUBJECT_COLORS } from '../i18n/translations';
import { Badge } from './StatusStates';
import NarrationControls from './NarrationControls';

/**
 * Responsive lazy-loaded Educational Video Player Card.
 * Loads iframe only on user click to keep ordinary student laptops fast and lightweight.
 * Always provides a direct external link fallback for non-embeddable educational portals,
 * plus on-demand multilingual translation of description & transcript.
 */
export default function VideoPlayerCard({ video, compact = false }) {
  const { language } = useApp();
  const [playerLoaded, setPlayerLoaded] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [translatedDesc, setTranslatedDesc] = useState('');
  const [translatedTranscript, setTranslatedTranscript] = useState('');
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    setTranslatedDesc('');
    setTranslatedTranscript('');
  }, [language, video.id]);

  const targetLang = language === 'en' ? 'kn' : language;
  const targetLangMeta =
    LANGUAGE_METADATA.find((l) => l.code === targetLang) || LANGUAGE_METADATA[1];

  const handleTranslate = async () => {
    setTranslating(true);
    try {
      const tasks = [];
      if (video.description) {
        tasks.push(
          labApi
            .translateText({ text: video.description, sourceLang: 'en', targetLang })
            .then((r) => setTranslatedDesc(r.translated_text))
        );
      }
      if (video.transcript) {
        tasks.push(
          labApi
            .translateText({ text: video.transcript, sourceLang: 'en', targetLang })
            .then((r) => setTranslatedTranscript(r.translated_text))
        );
      }
      await Promise.all(tasks);
    } catch {
      // Keep original text visible if translation endpoint fails
    } finally {
      setTranslating(false);
    }
  };

  const colorCfg = SUBJECT_COLORS[video.subject] || SUBJECT_COLORS.Physics;
  const canEmbed = Boolean(video.embed_url);

  return (
    <article className="lab-card flex flex-col overflow-hidden">
      {/* Responsive 16:9 Media Area */}
      <div className="relative aspect-video w-full overflow-hidden bg-navy-950">
        {canEmbed && playerLoaded ? (
          <iframe
            src={`${video.embed_url}?rel=0&cc_load_policy=1`}
            title={video.title}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-navy-900 to-navy-950">
            {video.thumbnail_url && (
              <img
                src={video.thumbnail_url}
                alt={video.title}
                loading="lazy"
                className="h-full w-full object-cover opacity-75 transition hover:opacity-90"
              />
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy-950/45 p-4 text-center">
              {canEmbed ? (
                <button
                  type="button"
                  onClick={() => setPlayerLoaded(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-elevated transition hover:scale-105 hover:bg-blue-500"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Load Video Player
                </button>
              ) : (
                <a
                  href={video.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-navy-800 px-4 py-2.5 text-xs font-bold text-white shadow-elevated transition hover:bg-blue-600"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Official Course Portal
                </a>
              )}
              <span className="mt-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-slate-200">
                {video.provider}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Metadata & Actions */}
      <div className={`flex flex-1 flex-col justify-between ${compact ? 'p-4' : 'p-5'}`}>
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={colorCfg.badge}>{video.subject}</Badge>
            <Badge variant="default">{video.difficulty}</Badge>
            {video.category && <Badge variant="amber">{video.category}</Badge>}
          </div>

          <h3 className={`mt-2.5 font-bold text-navy-900 dark:text-white ${compact ? 'text-sm' : 'text-base'}`}>
            {video.title}
          </h3>

          {video.description && (
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {video.description}
            </p>
          )}
          {translatedDesc && (
            <p className="mt-1.5 rounded-lg border border-blue-200 bg-blue-50/70 p-2 text-xs leading-relaxed text-navy-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
              <span className="font-bold">[{targetLang.toUpperCase()}] </span>
              {translatedDesc}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            {video.duration && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> {video.duration}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Globe className="h-3 w-3" /> {video.language.toUpperCase()}
            </span>
            {video.captions_available && (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Subtitles className="h-3 w-3" /> Captions
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-navy-800">
          <a
            href={video.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Watch on Source
          </a>
          <div className="flex flex-wrap items-center gap-1.5">
            {(video.description || video.transcript) && (
              <button
                type="button"
                onClick={handleTranslate}
                disabled={translating}
                className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
              >
                <Languages className="h-3 w-3" />
                {translating ? '...' : targetLangMeta.shortLabel}
              </button>
            )}
            {video.transcript && (
              <button
                type="button"
                onClick={() => setShowTranscript((s) => !s)}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-navy-700 dark:text-slate-300 dark:hover:bg-navy-800"
              >
                <FileText className="h-3 w-3" />
                {showTranscript ? 'Hide Transcript' : 'Transcript'}
              </button>
            )}
          </div>
        </div>

        {showTranscript && video.transcript && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700 dark:border-navy-700 dark:bg-navy-950 dark:text-slate-300">
            <p className="mb-2">{video.transcript}</p>
            {translatedTranscript && (
              <p className="mb-2 rounded border border-blue-200 bg-blue-50/70 p-2 text-navy-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
                <span className="font-bold">[{targetLang.toUpperCase()}] </span>
                {translatedTranscript}
              </p>
            )}
            <NarrationControls text={translatedTranscript || video.transcript} compact />
          </div>
        )}
      </div>
    </article>
  );
}
