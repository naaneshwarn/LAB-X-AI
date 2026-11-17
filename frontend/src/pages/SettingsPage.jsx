import React, { useEffect, useState } from 'react';
import { Globe, Moon, Save, Sun, User, Volume2 } from 'lucide-react';
import { labApi } from '../api/client';
import { useApp } from '../context/AppContext';
import { getAvailableVoices, isSpeechSupported, speakText } from '../services/narration';
import { Badge } from '../components/StatusStates';

export default function SettingsPage() {
  const {
    studentId,
    student,
    setStudent,
    language,
    setLanguage,
    theme,
    setTheme,
    narrationEnabled,
    setNarrationEnabled,
    preferredVoiceURI,
    setVoiceURI,
    addToast,
    t,
  } = useApp();

  const [name, setName] = useState(student?.name || 'Aarav Sharma (Demo Student)');
  const [gradeLevel, setGradeLevel] = useState(student?.grade_level || 'Class 10 - High School');
  const [languagesInfo, setLanguagesInfo] = useState([]);
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
      .getLanguages()
      .then((res) => setLanguagesInfo(res.languages || []))
      .catch(() => setLanguagesInfo([]));

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

        {/* Language Section */}
        <section className="lab-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-navy-900 dark:text-white">
            <Globe className="h-4 w-4 text-blue-600" />
            {t('settings.languageSection')}
          </h2>
          <label className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-200">
            {t('settings.languageLabel')}
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setLanguage('en', false)}
              className={`rounded-xl border p-3.5 text-left transition ${
                language === 'en'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60'
                  : 'border-slate-200 dark:border-navy-700'
              }`}
            >
              <p className="text-sm font-bold text-navy-900 dark:text-white">English</p>
              <p className="text-xs text-slate-500">Full UI, Quizzes & AI Tutor</p>
            </button>
            <button
              type="button"
              onClick={() => setLanguage('kn', false)}
              className={`rounded-xl border p-3.5 text-left transition ${
                language === 'kn'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60'
                  : 'border-slate-200 dark:border-navy-700'
              }`}
            >
              <p className="text-sm font-bold text-navy-900 dark:text-white">ಕನ್ನಡ (Kannada)</p>
              <p className="text-xs text-slate-500">Full UI, Quizzes & AI Tutor</p>
            </button>
          </div>

          {languagesInfo.length > 0 && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600 dark:border-navy-800 dark:bg-navy-950 dark:text-slate-300">
              <p className="font-semibold text-navy-900 dark:text-white">
                Extensible Multilingual Architecture (Indic Roadmap):
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {languagesInfo.map((lang) => (
                  <Badge key={lang.code} variant={lang.status === 'supported' ? 'emerald' : 'default'}>
                    {lang.native_name} ({lang.status})
                  </Badge>
                ))}
              </div>
            </div>
          )}
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

        {/* Narration Section */}
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
                  speakText({
                    text:
                      language === 'kn'
                        ? 'ಲ್ಯಾಬ್ ಎಕ್ಸ್ ಎಐ ವರ್ಚುವಲ್ ವಿಜ್ಞಾನ ಪ್ರಯೋಗಾಲಯಕ್ಕೆ ಸ್ವಾಗತ.'
                        : 'Welcome to LabXAI Interactive Virtual Science Laboratory.',
                    language,
                    voiceURI: preferredVoiceURI,
                  })
                }
                className="lab-btn-secondary text-xs"
              >
                Test Voice
              </button>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Powered by browser Web SpeechSynthesis. Modular narration service is ready for future AI4Bharat Indic-TTS integration.
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
