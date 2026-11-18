import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_STUDENT_ID, labApi } from '../api/client';
import { LANGUAGE_METADATA, translate } from '../i18n/translations';

const AppContext = createContext(null);
const VALID_LANGS = LANGUAGE_METADATA.map((l) => l.code);

export function AppProvider({ children }) {
  const [studentId] = useState(DEFAULT_STUDENT_ID);
  const [student, setStudent] = useState(null);
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem('labxai_lang') || 'en';
    return VALID_LANGS.includes(saved) ? saved : 'en';
  });
  const [theme, setThemeState] = useState(() => localStorage.getItem('labxai_theme') || 'light');
  const [reducedMotion, setReducedMotionState] = useState(
    () => localStorage.getItem('labxai_reduced_motion') === 'true'
  );
  const [lowPowerMode, setLowPowerModeState] = useState(
    () => localStorage.getItem('labxai_low_power') === 'true'
  );
  const [narrationEnabled, setNarrationEnabled] = useState(true);
  const [narrationRate, setNarrationRateState] = useState(
    () => parseFloat(localStorage.getItem('labxai_rate') || '1.0') || 1.0
  );
  const [preferredVoiceURI, setPreferredVoiceURI] = useState(
    () => localStorage.getItem('labxai_voice') || ''
  );
  const [backendHealth, setBackendHealth] = useState({ status: 'checking', ai_engine: 'unknown' });
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const applyTheme = useCallback((nextTheme) => {
    setThemeState(nextTheme);
    localStorage.setItem('labxai_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const setReducedMotion = useCallback((enabled) => {
    const val = Boolean(enabled);
    setReducedMotionState(val);
    localStorage.setItem('labxai_reduced_motion', String(val));
    if (val) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
  }, []);

  const setLowPowerMode = useCallback((enabled) => {
    const val = Boolean(enabled);
    setLowPowerModeState(val);
    localStorage.setItem('labxai_low_power', String(val));
  }, []);

  const setLanguage = useCallback(
    async (nextLang, persist = true) => {
      const safeLang = VALID_LANGS.includes(nextLang) ? nextLang : 'en';
      setLanguageState(safeLang);
      localStorage.setItem('labxai_lang', safeLang);
      if (persist) {
        try {
          const updated = await labApi.updateStudent(studentId, { preferred_language: safeLang });
          setStudent(updated);
        } catch {
          // Keep local preference if backend is temporarily unreachable
        }
      }
    },
    [studentId]
  );

  const setVoiceURI = useCallback((uri) => {
    setPreferredVoiceURI(uri);
    localStorage.setItem('labxai_voice', uri);
  }, []);

  const setNarrationRate = useCallback((rate) => {
    const num = Number(rate) || 1.0;
    setNarrationRateState(num);
    localStorage.setItem('labxai_rate', String(num));
  }, []);

  const refreshStudentAndHealth = useCallback(async () => {
    try {
      const [health, profile] = await Promise.all([
        labApi.getHealth(),
        labApi.getStudent(studentId),
      ]);
      setBackendHealth(health);
      setStudent(profile);
      if (profile.preferred_language && VALID_LANGS.includes(profile.preferred_language)) {
        setLanguageState(profile.preferred_language);
        localStorage.setItem('labxai_lang', profile.preferred_language);
      }
      if (profile.theme) {
        applyTheme(profile.theme);
      }
      setNarrationEnabled(Boolean(profile.narration_enabled));
    } catch {
      setBackendHealth({ status: 'offline', ai_engine: 'unknown' });
    }
  }, [studentId, applyTheme]);

  useEffect(() => {
    applyTheme(theme);
    setReducedMotion(reducedMotion);
    refreshStudentAndHealth();
  }, []);

  const t = useCallback((keyPath) => translate(language, keyPath), [language]);

  const value = useMemo(
    () => ({
      studentId,
      student,
      setStudent,
      language,
      setLanguage,
      theme,
      setTheme: applyTheme,
      reducedMotion,
      setReducedMotion,
      lowPowerMode,
      setLowPowerMode,
      narrationEnabled,
      setNarrationEnabled,
      narrationRate,
      setNarrationRate,
      preferredVoiceURI,
      setVoiceURI,
      backendHealth,
      refreshStudentAndHealth,
      toasts,
      addToast,
      dismissToast,
      t,
    }),
    [
      studentId,
      student,
      language,
      setLanguage,
      theme,
      applyTheme,
      reducedMotion,
      setReducedMotion,
      lowPowerMode,
      setLowPowerMode,
      narrationEnabled,
      narrationRate,
      setNarrationRate,
      preferredVoiceURI,
      setVoiceURI,
      backendHealth,
      refreshStudentAndHealth,
      toasts,
      addToast,
      dismissToast,
      t,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
