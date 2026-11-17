import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Loader2,
  Send,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react';
import { labApi } from '../api/client';
import { useApp } from '../context/AppContext';
import NarrationControls from './NarrationControls';
import { Badge } from './StatusStates';

export default function AiTutorPanel({ experimentId, parameters, measurements }) {
  const { language, studentId, t } = useApp();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [providerMeta, setProviderMeta] = useState(null);
  const [suggested, setSuggested] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setMessages([]);
    setProviderMeta(null);
    setSuggested([]);
    setErrorMsg('');
  }, [experimentId]);

  const handleExplain = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await labApi.explainExperiment({
        experimentId,
        parameters,
        measurements,
        language,
        studentId,
      });
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
          content: res.reply,
          fallbackUsed: res.fallback_used,
        },
      ]);
    } catch (err) {
      setErrorMsg(err.message || 'Unable to reach AI Tutor endpoint.');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (customQuestion) => {
    const questionText = (customQuestion ?? input).trim();
    if (!questionText || loading) return;

    const userMsg = { id: Date.now(), role: 'user', content: questionText };
    const nextHistory = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, userMsg]);
    if (!customQuestion) setInput('');
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await labApi.chatWithTutor({
        experimentId,
        question: questionText,
        parameters,
        measurements,
        history: nextHistory,
        language,
        studentId,
      });
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
          fallbackUsed: res.fallback_used,
        },
      ]);
    } catch (err) {
      setErrorMsg(err.message || 'AI Tutor request failed.');
    } finally {
      setLoading(false);
    }
  };

  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <div className="lab-card flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-navy-900 px-4 py-3 text-white dark:border-navy-800">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-400" />
          <div>
            <h3 className="text-sm font-bold">{t('lab.aiTutor')}</h3>
            <p className="text-[11px] text-slate-300">
              Grounded in your live simulation measurements
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {providerMeta && (
            <Badge variant={providerMeta.fallbackUsed ? 'amber' : 'emerald'}>
              {providerMeta.fallbackUsed ? t('lab.fallbackNotice') : t('lab.openrouterBadge')}
            </Badge>
          )}
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setMessages([]);
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
        <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <span>{providerMeta.errorNotice}</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-navy-800 dark:bg-navy-950/60">
        <button
          type="button"
          onClick={handleExplain}
          disabled={loading}
          className="lab-btn-accent py-1.5 text-xs"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {t('lab.explainNow')}
        </button>
        {lastAssistantMessage && <NarrationControls text={lastAssistantMessage.content} compact />}
      </div>

      {/* Chat History */}
      <div className="flex max-h-96 min-h-[220px] flex-col gap-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="my-auto py-4 text-center">
            <Sparkles className="mx-auto mb-2 h-7 w-7 text-blue-600/70" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Click &ldquo;{t('lab.explainNow')}&rdquo; or ask a question below.
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Your exact current parameters and calculated outputs are automatically shared with LabXAI.
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
              <div
                className={`max-w-[88%] whitespace-pre-wrap rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-navy-900 text-white dark:bg-blue-600'
                    : 'border border-slate-200 bg-slate-50 text-slate-800 dark:border-navy-700 dark:bg-navy-950 dark:text-slate-100'
                }`}
              >
                {msg.content}
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
            Analyzing your simulation measurements...
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

      {/* Question Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 border-t border-slate-200 p-3 dark:border-navy-800"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('lab.askPlaceholder')}
          maxLength={2000}
          className="lab-input flex-1"
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
