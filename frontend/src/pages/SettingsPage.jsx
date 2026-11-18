import React, { useEffect, useState } from 'react';
import { Globe, Mic, Moon, Save, Sun, User, Volume2 } from 'lucide-react';
import { labApi } from '../api/client';
import { useApp } from '../context/AppContext';
import { LANGUAGE_METADATA } from '../i18n/translations';
import { getAvailableVoices, isSpeechSupported, playRegionalNarration } from '../services/narration';
import { isVoiceInputSupported } from '../services/speechRecognition';
import { Badge } from '../components/StatusStates';

const VOICE_SAMPLES = {
  en: 'Welcome to LabXAI Interactive Multidisciplinary Virtual Laboratory.',
  kn: 'ಲ್ಯಾಬ್ ಎಕ್ಸ್ ಎಐ ವರ್ಚುವಲ್ ವಿಜ್ಞಾನ ಮತ್ತು ಗಣಿತ ಪ್ರಯೋಗಾಲಯಕ್ಕೆ ಸ್ವಾಗತ.',
  hi: 'लैब एक्स एआई वर्चुअल विज्ञान और गणित प्रयोगशाला में आपका स्वागत है।',
  te: 'ల్యాబ్ ఎక్స్ ఏఐ వర్చువల్ సైన్స్ మరియు గణిత ప్రయోగశాలకు స్వాగతం.',
  ta: 'லேப் எக்ஸ் ஏஐ மெய்நிகர் அறிவியல் மற்றும் கணித ஆய்வகத்திற்கு வரவேற்கிறோம்.',
};

const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5];

export default function SettingsPage() {
  const {
    studentId,
    student,
    setStudent,
    language,
    setLanguage,
    theme,
    setTheme,
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
    addToast,
    t,
  } = useApp();

  const [name, setName] = useState(student?.name || 'Aarav Sharma (Demo Student)');
  const [gradeLevel, setGradeLevel] = useState(student?.grade_level || 'Class 10 - High School');
  const [speechConfig, setSpeechConfig] = useState(null);
  const [voices, setVoices] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (student) {
      setName(student.name);
      setGradeLevel(student.grade_level);
    }
  }, [student]);

  useEffect(() => {
    labApi
      .getSpeechConfig()
      .then(setSpeechConfig)
      .catch(() => setSpeechConfig(null));

    const loadVoices = () => setVoices(getAvailableVoices());
    loadVoices();
    if (isSpeechSupported()) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await labApi.updateStudent(studentId, {
        name,
        grade_level: gradeLevel,
        preferred_language: language,
        theme,
        narration_enabled: narrationEnabled,
      });
      setStudent(updated);
      addToast(t('settings.savedSuccess'), 'success');
    } catch (err) {
      addToast(err.message || 'Unable to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-navy-900 dark:text-white sm:text-3xl">
          {t('settings.title')}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t('settings.subtitle')}</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Student Profile */}
        <section className="lab-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-navy-900 dark:text-white">
              <User className="h-4 w-4 text-blue-600" />
              {t('settings.profileSection')}
            </h2>
            <Badge variant="blue">Demo Student</Badge>
          </div>
          <p className="mb-4 text-xs text-slate-500">{t('settings.profileNote')}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t('settings.nameLabel')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={120}
                className="lab-input"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t('settings.gradeLabel')}
              </label>
              <input
                type="text"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                required
                minLength={2}
                maxLength={64}
                className="lab-input"
              />
            </div>
          </div>
        </section>

        {/* 5-Language Selection */}
        <section className="lab-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-navy-900 dark:text-white">
            <Globe className="h-4 w-4 text-blue-600" />
            {t('settings.languageSection')}
          </h2>
          <label className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-200">
            {t('settings.languageLabel')}
          </label>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LANGUAGE_METADATA.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code, false)}
                className={`rounded-xl border p-3.5 text-left transition ${
                  language === lang.code
                    ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/15 dark:bg-blue-950/60'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-navy-700 dark:hover:bg-navy-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-navy-900 dark:text-white">
                    {lang.nativeName}
                  </p>
                  <Badge variant="emerald">{lang.code.toUpperCase()}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {lang.name} · Voice ({lang.speechLocale})
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* Theme Section */}
        <section className="lab-card p-6">
          <h2 className="mb-4 text-base font-bold text-navy-900 dark:text-white">
            {t('settings.themeSection')}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition ${
                theme === 'light'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60'
                  : 'border-slate-200 dark:border-navy-700'
              }`}
            >
              <Sun className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-semibold text-navy-900 dark:text-white">
                {t('settings.themeLight')}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition ${
                theme === 'dark'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60'
                  : 'border-slate-200 dark:border-navy-700'
              }`}
            >
              <Moon className="h-5 w-5 text-blue-400" />
              <span className="text-sm font-semibold text-navy-900 dark:text-white">
                {t('settings.themeDark')}
              </span>
            </button>
          </div>
        </section>

        {/* Accessibility & School Hardware Mode */}
        <section className="lab-card p-6">
          <h2 className="mb-1 text-base font-bold text-slate-900 dark:text-white">
            Accessibility &amp; School Computer Mode
          </h2>
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
            Optimize LabXAI for government school desktops, laptops without GPUs, and motion sensitivity.
          </p>
          <div className="space-y-3">
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-sm dark:border-navy-700 dark:bg-navy-950">
              <input
                type="checkbox"
                checked={lowPowerMode}
                onChange={(e) => setLowPowerMode(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600"
              />
              <div>
                <span className="font-bold text-slate-900 dark:text-white">
                  2D Lightweight Mode (Low-End Hardware Fallback)
                </span>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Defaults interactive Biology, Chemistry, and Physics Playground views to ultra-lightweight 2D SVG visuals requiring no graphics card.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-sm dark:border-navy-700 dark:bg-navy-950">
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <div>
                <span className="font-bold text-slate-900 dark:text-white">
                  Reduced Motion
                </span>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Minimizes transitions and continuous background motion for improved reading comfort and accessibility.
                </p>
              </div>
            </label>
          </div>
        </section>

        {/* Narration & Voice Recognition Section */}
        <section className="lab-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-navy-900 dark:text-white">
            <Volume2 className="h-4 w-4 text-blue-600" />
            {t('settings.narrationSection')}
          </h2>

          <label className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={narrationEnabled}
              onChange={(e) => setNarrationEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            {t('settings.narrationEnable')}
          </label>

          {/* Playback Speed */}
          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Narration Playback Speed
            </label>
            <div className="flex flex-wrap gap-2">
              {SPEED_OPTIONS.map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setNarrationRate(rate)}
                  className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold transition ${
                    narrationRate === rate
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 bg-white text-slate-700 dark:border-navy-700 dark:bg-navy-950 dark:text-slate-300'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
              {t('settings.voiceLabel')}
            </label>
            <div className="flex flex-wrap gap-2">
              <select
                value={preferredVoiceURI}
                onChange={(e) => setVoiceURI(e.target.value)}
                className="lab-input max-w-md flex-1"
              >
                <option value="">Auto-detect by selected language</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  playRegionalNarration({
                    text: VOICE_SAMPLES[language] || VOICE_SAMPLES.en,
                    language,
                    rate: narrationRate,
                    voiceURI: preferredVoiceURI,
                    onError: (msg) => addToast(msg, 'error'),
                  })
                }
                className="lab-btn-secondary text-xs"
              >
                Test Regional Voice
              </button>
            </div>
          </div>

          {/* Browser Capability Check */}
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs dark:border-navy-800 dark:bg-navy-950">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 font-semibold text-navy-900 dark:text-white">
                <Mic className="h-3.5 w-3.5 text-blue-600" />
                Browser Speech Capabilities:
              </span>
              <Badge variant={isSpeechSupported() ? 'emerald' : 'amber'}>
                TTS Output: {isSpeechSupported() ? 'Supported' : 'Unavailable'}
              </Badge>
              <Badge variant={isVoiceInputSupported() ? 'emerald' : 'amber'}>
                Voice Input (STT): {isVoiceInputSupported() ? 'Supported' : 'Chrome/Edge Recommended'}
              </Badge>
            </div>
            <p className="mt-2 leading-relaxed text-slate-500">
              {speechConfig?.browser_requirements ||
                'Voice Input uses browser Web SpeechRecognition (best on Chrome/Edge) and Voice Output uses Web SpeechSynthesis with OS-installed voices. Text input and translation remain fully functional in all browsers.'}
            </p>
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="lab-btn-primary">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : t('settings.saveSettings')}
          </button>
        </div>
      </form>
    </div>
  );
}
