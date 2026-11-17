import React, { useEffect, useState } from 'react';
import { Pause, Play, Square, Volume2, AlertCircle } from 'lucide-react';
import {
  findVoicesForLanguage,
  isSpeechSupported,
  pauseNarration,
  resumeNarration,
  speakText,
  stopNarration,
} from '../services/narration';
import { useApp } from '../context/AppContext';

export default function NarrationControls({ text, compact = false }) {
  const { language, narrationEnabled, preferredVoiceURI, t } = useApp();
  const [status, setStatus] = useState('idle'); // idle | playing | paused
  const [notice, setNotice] = useState('');
  const [hasLangVoice, setHasLangVoice] = useState(true);

  useEffect(() => {
    const checkVoices = () => {
      if (!isSpeechSupported()) {
        setHasLangVoice(false);
        return;
      }
      const voices = findVoicesForLanguage(language);
      setHasLangVoice(voices.length > 0);
    };
    checkVoices();
    if (isSpeechSupported()) {
      window.speechSynthesis.onvoiceschanged = checkVoices;
    }
    return () => {
      stopNarration();
    };
  }, [language]);

  if (!narrationEnabled) return null;

  const handlePlay = () => {
    setNotice('');
    if (status === 'paused') {
      resumeNarration();
      setStatus('playing');
      return;
    }
    const res = speakText({
      text,
      language,
      voiceURI: preferredVoiceURI,
      onStart: () => setStatus('playing'),
      onEnd: () => setStatus('idle'),
      onError: (msg) => {
        setStatus('idle');
        setNotice(msg);
      },
    });
    if (res.ok && !res.voiceFound) {
      setNotice(
        language === 'kn'
          ? 'No dedicated Kannada browser voice detected on this OS; using default system voice.'
          : 'Using default system speech voice.'
      );
    }
  };

  const handlePause = () => {
    pauseNarration();
    setStatus('paused');
  };

  const handleStop = () => {
    stopNarration();
    setStatus('idle');
  };

  if (!isSpeechSupported()) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <AlertCircle className="h-3.5 w-3.5" />
        SpeechSynthesis unavailable in this browser.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {!compact && (
          <span className="mr-1 inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
            <Volume2 className="h-3.5 w-3.5 text-blue-600" />
            {t('lab.narration')}:
          </span>
        )}
        {status !== 'playing' ? (
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
        {status !== 'idle' && (
          <button
            type="button"
            onClick={handleStop}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-navy-700 dark:bg-navy-800 dark:text-slate-300"
          >
            <Square className="h-3 w-3" />
            {t('lab.stop')}
          </button>
        )}
      </div>
      {!hasLangVoice && !notice && language === 'kn' && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400">
          Note: Browser has no native Kannada (kn-IN) voice installed; narration may fall back to default system speech.
        </p>
      )}
      {notice && <p className="text-[11px] text-amber-600 dark:text-amber-400">{notice}</p>}
    </div>
  );
}
