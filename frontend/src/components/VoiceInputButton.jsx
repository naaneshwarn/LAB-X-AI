import React, { useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { isVoiceInputSupported, startVoiceRecognition } from '../services/speechRecognition';
import { useApp } from '../context/AppContext';

/**
 * Reusable microphone voice-input button powered by browser Web SpeechRecognition.
 * Reports browser incompatibility, mic denial, and empty recognition honestly.
 */
export default function VoiceInputButton({
  onTranscript,
  onInterim,
  onError,
  languageOverride = null,
  size = 'md',
  title = 'Speak with microphone',
}) {
  const { language, addToast } = useApp();
  const activeLang = languageOverride || language;
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const supported = isVoiceInputSupported();

  const toggleRecording = () => {
    if (!supported) {
      const msg =
        'Voice input (Web SpeechRecognition) is unavailable in this browser. Use Chrome or Edge.';
      onError?.(msg);
      addToast(msg, 'error');
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    recognitionRef.current = startVoiceRecognition({
      language: activeLang,
      onStart: () => setListening(true),
      onInterim: (interimText) => onInterim?.(interimText),
      onResult: (finalText, locale) => {
        onTranscript?.(finalText, activeLang, locale);
      },
      onError: (msg) => {
        setListening(false);
        onError?.(msg);
        addToast(msg, 'error');
      },
      onEnd: (hadResult) => {
        setListening(false);
        if (!hadResult) {
          onInterim?.('');
        }
      },
    });
  };

  const pad = size === 'sm' ? 'p-1.5' : 'p-2.5';

  return (
    <button
      type="button"
      onClick={toggleRecording}
      title={supported ? `${title} (${activeLang.toUpperCase()})` : 'Voice input unsupported in this browser'}
      aria-label={listening ? 'Stop voice recording' : title}
      className={`inline-flex shrink-0 items-center justify-center rounded-lg border transition ${pad} ${
        listening
          ? 'animate-pulse border-rose-500 bg-rose-600 text-white shadow-sm'
          : supported
          ? 'border-slate-300 bg-white text-slate-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-200 dark:hover:bg-navy-800'
          : 'border-slate-200 bg-slate-100 text-slate-400 dark:border-navy-800 dark:bg-navy-950'
      }`}
    >
      {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  );
}
