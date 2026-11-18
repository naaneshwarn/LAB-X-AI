/**
 * Hybrid Regional Audio Narration Service for LabXAI:
 * 1. Primary: Backend Multilingual Regional TTS (`POST /api/v1/speech/tts`) playing real MP3/WAV
 *    neural voices for en-IN, kn-IN, hi-IN, ta-IN, and te-IN independent of Windows OS voices.
 * 2. Secondary fallback: Browser Web SpeechSynthesis ONLY when a genuine matching language voice
 *    is installed on the OS — never silently playing regional text through an unrelated voice.
 */

import { API_BASE_URL, labApi } from '../api/client';

export const LOCALE_MAP = {
  en: 'en-IN',
  kn: 'kn-IN',
  hi: 'hi-IN',
  te: 'te-IN',
  ta: 'ta-IN',
};

let activeAudioElement = null;

export function isSpeechSupported() {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window
  );
}

export function getAvailableVoices() {
  if (!isSpeechSupported()) return [];
  return window.speechSynthesis.getVoices() || [];
}

export function findVoicesForLanguage(languageCode) {
  const voices = getAvailableVoices();
  const prefix = (languageCode || 'en').toLowerCase().slice(0, 2);
  return voices.filter((v) => (v.lang || '').toLowerCase().startsWith(prefix));
}

export function stripMarkdownForSpeech(text) {
  return String(text || '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[#>*_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stopNarration() {
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch {
      // ignore
    }
    activeAudioElement = null;
  }
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}

export function pauseNarration() {
  if (activeAudioElement) {
    activeAudioElement.pause();
    return;
  }
  if (isSpeechSupported()) {
    window.speechSynthesis.pause();
  }
}

export function resumeNarration() {
  if (activeAudioElement) {
    activeAudioElement.play().catch(() => {});
    return;
  }
  if (isSpeechSupported()) {
    window.speechSynthesis.resume();
  }
}

export function setActivePlaybackRate(rate) {
  if (activeAudioElement) {
    activeAudioElement.playbackRate = Math.min(2.0, Math.max(0.5, Number(rate) || 1.0));
  }
}

/**
 * Play localized speech via backend regional TTS first, falling back to browser SpeechSynthesis
 * ONLY when a genuine matching-language voice is installed on the device.
 */
export async function playRegionalNarration({
  text,
  language = 'en',
  voiceURI = '',
  rate = 1.0,
  onLoading,
  onMeta,
  onStart,
  onBoundary,
  onEnd,
  onError,
}) {
  const clean = stripMarkdownForSpeech(text);
  if (!clean) {
    onError?.('No narration text available.');
    return { ok: false };
  }

  stopNarration();
  onLoading?.(true);

  // 1. Primary: Backend Regional TTS (independent of Windows OS voices!)
  try {
    const res = await labApi.synthesizeSpeech({
      text: clean,
      language,
      speed: Number(rate) || 1.0,
    });
    if (res?.success && res?.audio_url) {
      const fullUrl = res.audio_url.startsWith('http')
        ? res.audio_url
        : `${API_BASE_URL}${res.audio_url}`;
      const audio = new Audio(fullUrl);
      audio.playbackRate = Math.min(2.0, Math.max(0.5, Number(rate) || 1.0));
      activeAudioElement = audio;

      onMeta?.({
        provider: res.provider,
        voice: res.voice,
        locale: res.locale,
        cached: res.cached,
      });

      audio.onplay = () => {
        onLoading?.(false);
        onStart?.();
      };
      audio.ontimeupdate = () => {
        if (audio.duration && Number.isFinite(audio.duration) && audio.duration > 0) {
          const pct = Math.min(100, Math.round((audio.currentTime / audio.duration) * 100));
          onBoundary?.(pct);
        }
      };
      audio.onended = () => {
        if (activeAudioElement === audio) activeAudioElement = null;
        onEnd?.();
      };
      audio.onerror = () => {
        if (activeAudioElement === audio) activeAudioElement = null;
        onLoading?.(false);
        onError?.(`Unable to play generated ${language.toUpperCase()} audio stream. Click Retry.`);
      };

      await audio.play();
      return { ok: true, provider: res.provider, voice: res.voice };
    }
  } catch (backendErr) {
    // Fall through cleanly ONLY if a genuine matching browser voice exists
    onLoading?.(false);
    const matchingBrowserVoices = findVoicesForLanguage(language);
    if (isSpeechSupported() && matchingBrowserVoices.length > 0) {
      const chosen =
        (voiceURI && matchingBrowserVoices.find((v) => v.voiceURI === voiceURI)) ||
        matchingBrowserVoices[0];
      onMeta?.({
        provider: 'browser',
        voice: chosen.name,
        locale: chosen.lang,
        cached: false,
      });
      return speakText({
        text: clean,
        language,
        voiceURI: chosen.voiceURI,
        rate,
        onStart,
        onBoundary,
        onEnd,
        onError,
      });
    }
    onError?.(
      backendErr?.message ||
        `Regional ${language.toUpperCase()} TTS is temporarily unavailable and no native ${language.toUpperCase()} browser voice is installed.`
    );
    return { ok: false };
  }

  onLoading?.(false);
  return { ok: false };
}

/**
 * Browser Web SpeechSynthesis helper (preserved for direct voice tests & matching-language fallback).
 */
export function speakText({
  text,
  language = 'en',
  voiceURI = '',
  rate = 1.0,
  onStart,
  onBoundary,
  onEnd,
  onError,
}) {
  if (!isSpeechSupported()) {
    onError?.('Browser SpeechSynthesis is not supported on this device.');
    return { ok: false, voiceFound: false };
  }

  const clean = stripMarkdownForSpeech(text);
  if (!clean) {
    onError?.('No narration text available.');
    return { ok: false, voiceFound: false };
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(clean);

  const voices = getAvailableVoices();
  let chosen = voiceURI ? voices.find((v) => v.voiceURI === voiceURI) : null;
  const matchingLangVoices = findVoicesForLanguage(language);
  if (!chosen && matchingLangVoices.length > 0) {
    chosen = matchingLangVoices[0];
  }

  const voiceFound = Boolean(chosen);
  if (chosen) {
    utterance.voice = chosen;
    utterance.lang = chosen.lang;
  } else {
    utterance.lang = LOCALE_MAP[language] || 'en-IN';
  }

  utterance.rate = Math.min(2.0, Math.max(0.5, Number(rate) || 1.0));
  utterance.onstart = () => onStart?.();
  utterance.onboundary = (ev) => {
    if (typeof ev.charIndex === 'number') {
      const pct = Math.min(100, Math.round((ev.charIndex / Math.max(1, clean.length)) * 100));
      onBoundary?.(pct, ev.charIndex);
    }
  };
  utterance.onend = () => onEnd?.();
  utterance.onerror = () =>
    onError?.('Unable to play audio narration with the selected browser voice.');

  window.speechSynthesis.speak(utterance);
  return { ok: true, voiceFound };
}
