import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Languages,
  Loader2,
  Send,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react';
import { labApi } from '../api/client';
import { useApp } from '../context/AppContext';
import { LANGUAGE_METADATA } from '../i18n/translations';
import NarrationControls from './NarrationControls';
import VoiceInputButton from './VoiceInputButton';
import MarkdownContent from './ui/MarkdownContent';
import { Badge } from './StatusStates';

const TUTOR_MODES = [
  { id: 'explain', label: 'Explain' },
  { id: 'hint', label: 'Hint' },
  { id: 'practice', label: 'Practice' },
  { id: 'simplify', label: 'Simplify' },
];

const EXPLAIN_LANGUAGES = [
  { code: 'en', label: 'English', badge: 'EN' },
  { code: 'kn', label: 'ಕನ್ನಡ', badge: 'KN' },
  { code: 'hi', label: 'हिन्दी', badge: 'HI' },
  { code: 'ta', label: 'தமிழ்', badge: 'TA' },
  { code: 'te', label: 'తెలుగు', badge: 'TE' },
];

export default function AiTutorPanel({ experimentId, parameters, measurements, pendingPrompt = null }) {
  const { language, studentId, t } = useApp();
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(() => `conv-${experimentId}-${Date.now()}`);
  const [providersInfo, setProvidersInfo] = useState(null);
  const [input, setInput] = useState('');
  const [explainLang, setExplainLang] = useState(language || 'en');
  const [hasExplained, setHasExplained] = useState(false);
  const [voiceLang, setVoiceLang] = useState(language);
  const [originalTranscript, setOriginalTranscript] = useState('');
  const [interimSpeech, setInterimSpeech] = useState('');
  const [translatingSpeech, setTranslatingSpeech] = useState(false);
  const [tutorMode, setTutorMode] = useState('explain');
  const [loading, setLoading] = useState(false);
  const [providerMeta, setProviderMeta] = useState(null);
  const [suggested, setSuggested] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setVoiceLang(language);
    setExplainLang(language || 'en');
  }, [language]);

  useEffect(() => {
    labApi.getAiProviders().then(setProvidersInfo).catch(() => setProvidersInfo(null));
  }, []);

  useEffect(() => {
    setMessages([]);
    setConversationId(`conv-${experimentId}-${Date.now()}`);
    setHasExplained(false);
    setProviderMeta(null);
    setSuggested([]);
    setErrorMsg('');
    setOriginalTranscript('');
  }, [experimentId]);

  // Triggered when user clicks "Ask AI Tutor" on a specific organ, element, or lab apparatus
  useEffect(() => {
    if (pendingPrompt?.id && pendingPrompt?.question) {
      handleSend(pendingPrompt.question, pendingPrompt.context || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPrompt?.id]);

  const handleVoiceTranscript = async (transcript, spokenLang) => {
    setInterimSpeech('');
    setOriginalTranscript(transcript);
    setInput(transcript);

    // If spoken language differs from learning language (or to preview English/target), translate via backend
    if (spokenLang !== language) {
      setTranslatingSpeech(true);
      try {
        const res = await labApi.translateText({
          text: transcript,
          sourceLang: spokenLang,
          targetLang: language,
          preserveScientificTerms: true,
        });
        setInput(res.translated_text || transcript);
      } catch {
        // Keep original transcript editable
      } finally {
        setTranslatingSpeech(false);
      }
    }
  };

  const handleTranslateInput = async (targetLang) => {
    if (!input.trim()) return;
    setTranslatingSpeech(true);
    try {
      const res = await labApi.translateText({
        text: input.trim(),
        sourceLang: voiceLang,
        targetLang,
        preserveScientificTerms: true,
      });
      if (!originalTranscript) setOriginalTranscript(input.trim());
      setInput(res.translated_text || input);
    } catch (err) {
      setErrorMsg(err.message || 'Translation failed.');
    } finally {
      setTranslatingSpeech(false);
    }
  };

  const handleExplain = async (overrideLang = null) => {
    const targetLang = typeof overrideLang === 'string' ? overrideLang : explainLang;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await labApi.explainExperiment({
        experimentId,
        parameters,
        measurements,
        language: targetLang,
        studentId,
        mode: tutorMode,
        conversationId,
      });
      if (res.conversation_id) setConversationId(res.conversation_id);
      setHasExplained(true);
      setProviderMeta({
        provider: res.provider,
        model: res.model,
        fallbackUsed: res.fallback_used,
        errorNotice: res.error_notice,
      });
      setSuggested(res.suggested_questions || []);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: 'assistant',
          content: res.explanation || res.reply,
          language: res.language || targetLang,
          fallbackUsed: res.fallback_used,
        },
      ]);
    } catch (err) {
      setErrorMsg(err.message || 'Unable to reach AI Tutor endpoint.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExplainLang = (langCode) => {
    setExplainLang(langCode);
    // If the student already generated an explanation, immediately regenerate in the newly selected language
    if (hasExplained && !loading) {
      handleExplain(langCode);
    }
  };

  const handleSend = async (customQuestion, extraContext = null) => {
    const questionText = (customQuestion ?? input).trim();
    if (!questionText || loading) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: questionText,
      originalSpeech: !customQuestion && originalTranscript && originalTranscript !== questionText ? originalTranscript : '',
    };
    const nextHistory = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, userMsg]);
    if (!customQuestion) {
      setInput('');
      setOriginalTranscript('');
    }
    setLoading(true);
    setErrorMsg('');

    try {
      const mergedParams = extraContext ? { ...parameters, ...extraContext } : parameters;
      const res = await labApi.chatWithTutor({
        experimentId,
        question: questionText,
        parameters: mergedParams,
        measurements,
        history: nextHistory,
        language: explainLang,
        studentId,
        mode: tutorMode,
        conversationId,
      });
      if (res.conversation_id) setConversationId(res.conversation_id);
      setProviderMeta({
        provider: res.provider,
        model: res.model,
        fallbackUsed: res.fallback_used,
        errorNotice: res.error_notice,
      });
      setSuggested(res.suggested_questions || []);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: res.reply,
          language: res.language,
          fallbackUsed: res.fallback_used,
        },
      ]);
    } catch (err) {
      setErrorMsg(err.message || 'AI Tutor request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lab-card flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-navy-900 px-4 py-3 text-white dark:border-navy-800">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-400" />
          <div>
            <h3 className="text-sm font-bold">{t('lab.aiTutor')}</h3>
            <p className="text-[11px] text-slate-300">
              Grounded in live calculations · {explainLang.toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(providerMeta || providersInfo) && (
            <Badge
              variant={
                (providerMeta?.provider || providersInfo?.active_provider) === 'openrouter'
                  ? 'emerald'
                  : (providerMeta?.provider || providersInfo?.active_provider) === 'local'
                  ? 'blue'
                  : 'amber'
              }
            >
              {(providerMeta?.provider || providersInfo?.active_provider) === 'openrouter'
                ? t('lab.openrouterBadge')
                : (providerMeta?.provider || providersInfo?.active_provider) === 'local'
                ? 'Local AI'
                : t('lab.fallbackNotice')}
            </Badge>
          )}
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setMessages([]);
                setConversationId(`conv-${experimentId}-${Date.now()}`);
                setHasExplained(false);
                setErrorMsg('');
              }}
              className="inline-flex items-center gap-1 rounded-md bg-navy-800 px-2 py-1 text-xs text-slate-200 hover:bg-navy-700"
              title={t('lab.clearChat')}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Honest Provider / Fallback Notice */}
      {providerMeta?.errorNotice && (
        <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <span>{providerMeta.errorNotice}</span>
        </div>
      )}

      {/* Mode Selector + Quick Explain Bar + Explanation Language Selector */}
      <div className="space-y-2.5 border-b border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-navy-800 dark:bg-navy-950/60">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1">
            {TUTOR_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setTutorMode(m.id)}
                className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                  tutorMode === m.id
                    ? 'bg-navy-900 text-white dark:bg-blue-600'
                    : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-navy-900 dark:text-slate-300'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => handleExplain()}
            disabled={loading}
            className="lab-btn-accent px-3 py-1.5 text-xs"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {t('lab.explainNow')}
          </button>
        </div>

        {/* Dedicated 5-Language Selector for Explain Current Results */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-200/80 pt-2 dark:border-navy-800">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <Languages className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            Explain Current Results In:
          </span>
          <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Explanation language selector">
            {EXPLAIN_LANGUAGES.map((item) => {
              const active = explainLang === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  disabled={loading}
                  onClick={() => handleSelectExplainLang(item.code)}
                  aria-pressed={active}
                  className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold transition ${
                    active
                      ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/50 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-200 dark:hover:bg-navy-800'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex max-h-[420px] min-h-[220px] flex-col gap-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="my-auto py-4 text-center">
            <Sparkles className="mx-auto mb-2 h-7 w-7 text-blue-600/70" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Click &ldquo;{t('lab.explainNow')}&rdquo; or speak / type a question below.
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Supports English, ಕನ್ನಡ, हिन्दी, తెలుగు, and தமிழ் with voice input &amp; read-aloud.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div className="max-w-[88%] space-y-1.5">
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 bg-slate-50 text-slate-800 dark:border-navy-700 dark:bg-navy-950 dark:text-slate-100'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <MarkdownContent content={msg.content} />
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}
                  {msg.originalSpeech && (
                    <p className="mt-1.5 border-t border-white/20 pt-1 text-[11px] opacity-80">
                      Original speech: {msg.originalSpeech}
                    </p>
                  )}
                </div>
                {msg.role === 'assistant' && (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <NarrationControls
                      text={msg.content}
                      languageOverride={msg.language || explainLang}
                      compact
                    />
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-slate-500 dark:bg-navy-800 dark:text-slate-300">
                      {(msg.language || explainLang).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 dark:bg-navy-800 dark:text-slate-200">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            Analyzing your live simulation data...
          </div>
        )}

        {errorMsg && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Suggested Questions */}
      {suggested.length > 0 && (
        <div className="border-t border-slate-200 bg-slate-50/70 px-4 py-2.5 dark:border-navy-800 dark:bg-navy-950/40">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {t('lab.suggestedQuestions')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggested.map((q) => (
              <button
                key={q}
                type="button"
                disabled={loading}
                onClick={() => handleSend(q)}
                className="rounded-full border border-blue-200 bg-white px-2.5 py-1 text-left text-xs text-blue-700 transition hover:bg-blue-50 dark:border-navy-700 dark:bg-navy-900 dark:text-blue-300 dark:hover:bg-navy-800"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Voice Translation Comparison Banner (shows Original Recognized Speech vs Editable Input) */}
      {(originalTranscript || interimSpeech) && (
        <div className="border-t border-blue-200 bg-blue-50/70 px-3.5 py-2 text-xs dark:border-blue-900 dark:bg-blue-950/40">
          {interimSpeech ? (
            <p className="italic text-blue-700 dark:text-blue-300">Listening: &ldquo;{interimSpeech}&rdquo;...</p>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-slate-700 dark:text-slate-200">
                <strong>Original Speech ({voiceLang.toUpperCase()}):</strong> {originalTranscript}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={translatingSpeech}
                  onClick={() => handleTranslateInput(language === 'en' ? 'kn' : 'en')}
                  className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[11px] font-semibold text-blue-700 shadow-sm dark:bg-navy-800 dark:text-blue-300"
                >
                  <Languages className="h-3 w-3" />
                  {translatingSpeech ? 'Translating...' : `Translate → ${language === 'en' ? 'KN' : 'EN'}`}
                </button>
                <button
                  type="button"
                  onClick={() => setOriginalTranscript('')}
                  className="text-[11px] text-slate-400 hover:text-slate-600"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Voice Language + Editable Question Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex flex-wrap items-center gap-2 border-t border-slate-200 p-3 dark:border-navy-800"
      >
        <select
          value={voiceLang}
          onChange={(e) => setVoiceLang(e.target.value)}
          aria-label="Voice input language"
          title="Spoken input language"
          className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-2 text-xs font-semibold text-slate-700 dark:border-navy-700 dark:bg-navy-950 dark:text-slate-200"
        >
          {LANGUAGE_METADATA.map((l) => (
            <option key={l.code} value={l.code}>
              {l.shortLabel}
            </option>
          ))}
        </select>

        <VoiceInputButton
          languageOverride={voiceLang}
          onInterim={setInterimSpeech}
          onTranscript={handleVoiceTranscript}
          onError={setErrorMsg}
          title="Speak question to AI Tutor"
        />

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('lab.askPlaceholder')}
          maxLength={2000}
          className="lab-input min-w-[140px] flex-1"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="lab-btn-primary shrink-0 px-3.5"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">{t('lab.send')}</span>
        </button>
      </form>
    </div>
  );
}
