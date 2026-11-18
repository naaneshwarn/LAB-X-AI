import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader2, Pause, Play, RotateCcw, Square, Volume2 } from 'lucide-react';
import {
  pauseNarration,
  playRegionalNarration,
  resumeNarration,
  setActivePlaybackRate,
  stopNarration,
} from '../services/narration';
import { useApp } from '../context/AppContext';

const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5];

export default function NarrationControls({ text, languageOverride = null, compact = false }) {
  const { language, narrationEnabled, narrationRate, setNarrationRate, preferredVoiceURI, t } = useApp();
  const activeLang = languageOverride || language;
  const [status, setStatus] = useState('idle'); // idle | loading | playing | paused
  const [progressPct, setProgressPct] = useState(0);
  const [notice, setNotice] = useState('');
  const [ttsMeta, setTtsMeta] = useState(null);

  // Switching languages immediately stops active audio & clears status
  useEffect(() => {
    stopNarration();
    setStatus('idle');
    setProgressPct(0);
    setNotice('');
    setTtsMeta(null);
    return () => {
      stopNarration();
    };
  }, [activeLang]);

  // Apply live speed changes to currently playing HTML5 audio immediately
  useEffect(() => {
    setActivePlaybackRate(narrationRate);
  }, [narrationRate]);

  if (!narrationEnabled) return null;

  const startFresh = () => {
    setNotice('');
    setProgressPct(0);
    playRegionalNarration({
      text,
      language: activeLang,
      voiceURI: preferredVoiceURI,
      rate: narrationRate,
      onLoading: (isLoading) => {
        if (isLoading) setStatus('loading');
      },
      onMeta: (meta) => setTtsMeta(meta),
      onStart: () => setStatus('playing'),
      onBoundary: (pct) => setProgressPct(pct),
      onEnd: () => {
        setStatus('idle');
        setProgressPct(100);
      },
      onError: (msg) => {
        setStatus('idle');
        setNotice(msg);
      },
    });
  };

  const handlePlay = () => {
    if (status === 'paused') {
      resumeNarration();
      setStatus('playing');
      return;
    }
    startFresh();
  };

  const handlePause = () => {
    pauseNarration();
    setStatus('paused');
  };

  const handleStop = () => {
    stopNarration();
    setStatus('idle');
    setProgressPct(0);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {!compact && (
          <span className="mr-1 inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
            <Volume2
              className={`h-3.5 w-3.5 ${
                status === 'playing' ? 'animate-pulse text-emerald-600' : 'text-blue-600'
              }`}
            />
            {t('lab.narration')}:
          </span>
        )}

        {status === 'loading' ? (
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200"
          >
            <Loader2 className="h-3 w-3 animate-spin" />
            Generating {activeLang.toUpperCase()}...
          </button>
        ) : status !== 'playing' ? (
          <button
            type="button"
            onClick={handlePlay}
            disabled={!text}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-navy-700 dark:bg-navy-800 dark:text-slate-200"
          >
            <Play className="h-3 w-3 text-blue-600" />
            {status === 'paused' ? t('lab.resume') : t('lab.play')}
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePause}
            className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200"
          >
            <Pause className="h-3 w-3" />
            {t('lab.pause')}
          </button>
        )}

        {(status === 'playing' || status === 'paused') && (
          <>
            <button
              type="button"
              onClick={handleStop}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-navy-700 dark:bg-navy-800 dark:text-slate-300"
              title={t('lab.stop')}
            >
              <Square className="h-3 w-3" />
              {!compact && t('lab.stop')}
            </button>
            <button
              type="button"
              onClick={startFresh}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-navy-700 dark:bg-navy-800 dark:text-slate-300"
              title={t('lab.replay')}
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </>
        )}

        {/* Playback Speed Selector */}
        <select
          value={narrationRate}
          onChange={(e) => setNarrationRate(parseFloat(e.target.value))}
          aria-label="Narration playback speed"
          className="rounded-md border border-slate-200 bg-white px-1.5 py-1 font-mono text-[11px] font-semibold text-slate-600 dark:border-navy-700 dark:bg-navy-800 dark:text-slate-200"
        >
          {SPEED_OPTIONS.map((sp) => (
            <option key={sp} value={sp}>
              {sp}x
            </option>
          ))}
        </select>

        {/* Active TTS Provider & Voice Indicator */}
        {ttsMeta?.voice && (
          <span
            className="rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
            title={`TTS Provider: ${ttsMeta.provider} | Voice: ${ttsMeta.voice}`}
          >
            {ttsMeta.provider} · {ttsMeta.voice}
          </span>
        )}
      </div>

      {/* Live Playback Progress Bar */}
      {status === 'playing' && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-blue-100 dark:bg-navy-800">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-200"
              style={{ width: `${Math.max(8, progressPct)}%` }}
            />
          </div>
          <span className="font-mono text-[10px] font-semibold text-blue-600 dark:text-blue-400">
            Speaking ({activeLang.toUpperCase()})
          </span>
        </div>
      )}

      {/* Honest Error Notice + Retry */}
      {notice && (
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-amber-700 dark:text-amber-300">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{notice}</span>
          <button
            type="button"
            onClick={startFresh}
            className="rounded border border-amber-300 px-1.5 py-0.5 text-[10px] font-bold hover:bg-amber-50 dark:border-amber-700"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
