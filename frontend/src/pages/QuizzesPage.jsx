import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  ClipboardList,
  FlaskConical,
  Languages,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { labApi } from '../api/client';
import { useApp } from '../context/AppContext';
import { LANGUAGE_METADATA, SUBJECT_COLORS } from '../i18n/translations';
import NarrationControls from '../components/NarrationControls';
import { Badge, EmptyState, ErrorState, LoadingState } from '../components/StatusStates';

const SUBJECTS = ['all', 'Physics', 'Chemistry', 'Biology', 'Mathematics'];
const DIFFICULTIES = ['all', 'Basic', 'Intermediate', 'Advanced'];

export default function QuizzesPage() {
  const { language, studentId, addToast, t } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterExperiment = searchParams.get('experiment');
  const initialSubject = searchParams.get('subject') || 'all';

  const [subject, setSubject] = useState(initialSubject);
  const [difficulty, setDifficulty] = useState('all');
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [translatedQuestion, setTranslatedQuestion] = useState(null);
  const [translatingQ, setTranslatingQ] = useState(false);

  useEffect(() => {
    setTranslatedQuestion(null);
  }, [currentIdx, activeQuiz?.id, language]);

  const handleTranslateQuestion = async (question) => {
    if (!question) return;
    const targetLang = language === 'en' ? 'kn' : language;
    setTranslatingQ(true);
    try {
      const qRes = await labApi.translateText({
        text: question.question_text,
        sourceLang: 'en',
        targetLang,
        preserveScientificTerms: true,
      });
      setTranslatedQuestion({
        targetLang,
        text: qRes.translated_text,
        provider: qRes.provider,
      });
    } catch {
      addToast('Unable to translate question right now.', 'error');
    } finally {
      setTranslatingQ(false);
    }
  };

  const loadQuizzes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await labApi.listQuizzes(
        filterExperiment ? { experimentId: filterExperiment } : { subject, difficulty }
      );
      setQuizzes(data);
      if (filterExperiment) {
        const match = data.find((q) => q.experiment_id === filterExperiment);
        if (match) {
          const detail = await labApi.getQuiz(match.id);
          setActiveQuiz(detail);
          setCurrentIdx(0);
          setAnswers({});
          setResult(null);
        }
      }
    } catch (err) {
      setError(err.message || 'Unable to load quizzes.');
    } finally {
      setLoading(false);
    }
  }, [filterExperiment, subject, difficulty]);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  const startQuiz = async (quizId) => {
    setLoading(true);
    setError('');
    try {
      const detail = await labApi.getQuiz(quizId);
      setActiveQuiz(detail);
      setCurrentIdx(0);
      setAnswers({});
      setResult(null);
    } catch (err) {
      setError(err.message || 'Unable to open quiz.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleNumericChange = (questionId, rawValue) => {
    if (rawValue === '') {
      setAnswers((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
      return;
    }
    setAnswers((prev) => ({ ...prev, [questionId]: rawValue }));
  };

  const handleSubmit = async () => {
    if (!activeQuiz) return;
    setSubmitting(true);
    try {
      const normalizedAnswers = {};
      Object.entries(answers).forEach(([qId, val]) => {
        const q = activeQuiz.questions.find((item) => item.id === qId);
        if (q?.question_type === 'numerical') {
          const num = parseFloat(val);
          if (!Number.isNaN(num)) normalizedAnswers[qId] = num;
        } else {
          normalizedAnswers[qId] = Number(val);
        }
      });

      const res = await labApi.submitQuiz(activeQuiz.id, {
        studentId,
        answers: normalizedAnswers,
      });
      setResult(res);
      addToast(
        `Quiz graded: ${res.score}/${res.total_questions} (${res.percentage}%) — saved to history.`,
        res.passed ? 'success' : 'info'
      );
    } catch (err) {
      addToast(err.message || 'Failed to submit quiz.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetToCatalog = () => {
    setActiveQuiz(null);
    setResult(null);
    setAnswers({});
    setCurrentIdx(0);
    if (filterExperiment) setSearchParams({});
  };

  if (loading) return <LoadingState message={t('common.loading')} />;
  if (error) return <ErrorState message={error} onRetry={loadQuizzes} />;

  // Graded Result Screen
  if (activeQuiz && result) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <button type="button" onClick={resetToCatalog} className="lab-btn-secondary mb-6 text-xs">
          <ArrowLeft className="h-3.5 w-3.5" />
          {t('quizzes.backToList')}
        </button>

        <div className="lab-card p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6 dark:border-navy-800">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={result.passed ? 'emerald' : 'amber'}>
                  {result.passed ? t('quizzes.passed') : t('quizzes.needsReview')}
                </Badge>
                {activeQuiz.subject && (
                  <Badge variant={(SUBJECT_COLORS[activeQuiz.subject] || SUBJECT_COLORS.Physics).badge}>
                    {activeQuiz.subject}
                  </Badge>
                )}
                {activeQuiz.difficulty && <Badge variant="default">{activeQuiz.difficulty}</Badge>}
              </div>
              <h1 className="mt-2 text-2xl font-extrabold text-navy-900 dark:text-white">
                {language === 'kn' ? activeQuiz.title_kn : activeQuiz.title}
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                {t('quizzes.passingThreshold')}: {result.passing_score}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase text-slate-500">{t('quizzes.yourScore')}</p>
              <p className="font-mono text-4xl font-extrabold text-blue-600 dark:text-blue-400">
                {result.percentage}%
              </p>
              <p className="font-mono text-sm text-slate-600 dark:text-slate-300">
                {result.score} / {result.total_questions}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="mb-4 text-base font-bold text-navy-900 dark:text-white">
              {t('quizzes.reviewAnswers')}
            </h2>
            <div className="space-y-4">
              {result.feedback.map((item, index) => {
                const questionObj = activeQuiz.questions.find((q) => q.id === item.question_id);
                const isNumerical = item.question_type === 'numerical';
                const opts = questionObj
                  ? language === 'kn'
                    ? questionObj.options_kn
                    : questionObj.options
                  : [];

                return (
                  <div
                    key={item.question_id}
                    className={`rounded-xl border p-4 ${
                      item.is_correct
                        ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30'
                        : 'border-rose-200 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-navy-900 dark:text-white">
                        {index + 1}. {language === 'kn' ? item.question_text_kn : item.question_text}
                      </p>
                      {item.is_correct ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                      ) : (
                        <XCircle className="h-5 w-5 shrink-0 text-rose-600" />
                      )}
                    </div>
                    <div className="mt-2 space-y-1 text-xs">
                      {isNumerical ? (
                        <>
                          <p className="text-slate-600 dark:text-slate-300">
                            Your answer:{' '}
                            <span className="font-mono font-semibold">
                              {item.submitted_value !== null && item.submitted_value !== undefined
                                ? `${item.submitted_value} ${questionObj?.unit || ''}`
                                : 'Unanswered'}
                            </span>
                          </p>
                          {!item.is_correct && (
                            <p className="text-emerald-700 dark:text-emerald-400">
                              Correct value:{' '}
                              <span className="font-mono font-semibold">
                                {item.correct_numeric} {questionObj?.unit || ''}
                              </span>
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-slate-600 dark:text-slate-300">
                            Your answer:{' '}
                            <span className="font-semibold">
                              {item.selected_index !== null && item.selected_index !== undefined
                                ? opts[item.selected_index]
                                : 'Unanswered'}
                            </span>
                          </p>
                          {!item.is_correct && (
                            <p className="text-emerald-700 dark:text-emerald-400">
                              Correct answer:{' '}
                              <span className="font-semibold">{opts[item.correct_index]}</span>
                            </p>
                          )}
                        </>
                      )}
                      <p className="mt-2 rounded-lg bg-white/80 p-2.5 text-slate-700 dark:bg-navy-900/70 dark:text-slate-200">
                        {language === 'kn' ? item.explanation_kn : item.explanation}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setAnswers({});
                setCurrentIdx(0);
              }}
              className="lab-btn-primary"
            >
              <RotateCcw className="h-4 w-4" />
              {t('quizzes.retakeQuiz')}
            </button>
            <Link to={`/lab/${activeQuiz.experiment_id}`} className="lab-btn-secondary">
              <FlaskConical className="h-4 w-4" />
              Return to Experiment
            </Link>
            <Link to="/dashboard" className="lab-btn-secondary">
              View Updated Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Active One-Question-at-a-Time Runner
  if (activeQuiz) {
    const question = activeQuiz.questions[currentIdx];
    const isNumerical = question.question_type === 'numerical';
    const options = language === 'kn' ? question.options_kn : question.options;
    const selectedVal = answers[question.id];
    const total = activeQuiz.questions.length;
    const answeredCount = Object.keys(answers).length;
    const typeLabel =
      question.question_type === 'numerical'
        ? 'Numerical Calculation'
        : question.question_type === 'true_false'
        ? 'True / False'
        : question.question_type === 'formula'
        ? 'Formula & Equation'
        : 'Multiple Choice';

    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-5 flex items-center justify-between">
          <button type="button" onClick={resetToCatalog} className="lab-btn-secondary text-xs">
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('quizzes.backToList')}
          </button>
          <span className="font-mono text-xs font-semibold text-slate-500">
            {t('quizzes.questionOf')} {currentIdx + 1} {t('quizzes.of')} {total}
          </span>
        </div>

        <div className="lab-card p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-lg font-bold text-navy-900 dark:text-white">
              {language === 'kn' ? activeQuiz.title_kn : activeQuiz.title}
            </h1>
            <Badge variant="violet">{typeLabel}</Badge>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-navy-800">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${((currentIdx + 1) / total) * 100}%` }}
            />
          </div>

          <p className="mt-6 text-base font-semibold leading-relaxed text-navy-900 dark:text-white sm:text-lg">
            {currentIdx + 1}. {language === 'kn' ? question.question_text_kn : question.question_text}
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <NarrationControls
              text={
                translatedQuestion?.text ||
                (language === 'kn' ? question.question_text_kn : question.question_text)
              }
              compact
            />
            <button
              type="button"
              onClick={() => handleTranslateQuestion(question)}
              disabled={translatingQ}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
            >
              <Languages className="h-3.5 w-3.5" />
              {translatingQ
                ? 'Translating...'
                : `Translate → ${
                    (
                      LANGUAGE_METADATA.find(
                        (l) => l.code === (language === 'en' ? 'kn' : language)
                      ) || LANGUAGE_METADATA[1]
                    ).nativeName
                  }`}
            </button>
          </div>

          {translatedQuestion && (
            <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-navy-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
              <span className="font-bold">[{translatedQuestion.targetLang.toUpperCase()}] </span>
              {translatedQuestion.text}
            </div>
          )}

          {isNumerical ? (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-navy-700 dark:bg-navy-950">
              <label className="mb-2 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Enter your calculated numerical value{question.unit ? ` (${question.unit})` : ''}:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="any"
                  value={selectedVal ?? ''}
                  onChange={(e) => handleNumericChange(question.id, e.target.value)}
                  placeholder="e.g., 4.5"
                  className="lab-input max-w-xs font-mono text-base font-bold"
                />
                {question.unit && (
                  <span className="font-mono text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {question.unit}
                  </span>
                )}
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Standard rounding tolerance is accepted automatically during grading.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {options.map((opt, idx) => {
                const isSelected = selectedVal === idx;
                return (
                  <button
                    key={`${question.id}-${idx}`}
                    type="button"
                    onClick={() => handleSelectOption(question.id, idx)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 font-semibold text-navy-900 ring-2 ring-blue-600/20 dark:border-blue-500 dark:bg-blue-950/60 dark:text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-navy-700 dark:bg-navy-950 dark:text-slate-200 dark:hover:bg-navy-800'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-bold ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 text-slate-500 dark:border-navy-600'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-5 dark:border-navy-800">
            <button
              type="button"
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              className="lab-btn-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('quizzes.previous')}
            </button>

            {currentIdx < total - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIdx((i) => Math.min(total - 1, i + 1))}
                className="lab-btn-primary"
              >
                {t('quizzes.next')}
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || answeredCount === 0}
                className="lab-btn-accent"
              >
                <Award className="h-4 w-4" />
                {submitting
                  ? t('quizzes.submitting')
                  : `${t('quizzes.submitQuiz')} (${answeredCount}/${total})`}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Quiz Catalog View with Subject & Difficulty Filters
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 dark:text-white sm:text-3xl">
            {t('quizzes.title')}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t('quizzes.subtitle')}</p>
        </div>
        <span className="font-mono text-xs font-semibold text-slate-500">
          {quizzes.length} quizzes available
        </span>
      </div>

      {/* Discipline Tabs & Difficulty Filters */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSubject(s)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                subject === s
                  ? 'bg-navy-900 text-white shadow-sm dark:bg-blue-600'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-300'
              }`}
            >
              {s === 'all' ? t('library.allSubjects') : s}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {DIFFICULTIES.map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setDifficulty(lvl)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                difficulty === lvl
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-300'
              }`}
            >
              {lvl === 'all' ? t('library.allDifficulties') : lvl}
            </button>
          ))}
        </div>
      </div>

      {quizzes.length === 0 ? (
        <EmptyState
          title="No quizzes match your current filters."
          action={
            <button
              type="button"
              onClick={() => {
                setSubject('all');
                setDifficulty('all');
              }}
              className="lab-btn-secondary text-xs"
            >
              Reset Filters
            </button>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => {
            const themeStyle = SUBJECT_COLORS[quiz.subject] || SUBJECT_COLORS.Physics;
            return (
              <div key={quiz.id} className="lab-card flex flex-col justify-between p-5">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant={themeStyle.badge}>{quiz.subject || 'Physics'}</Badge>
                      <Badge
                        variant={
                          quiz.difficulty === 'Basic'
                            ? 'emerald'
                            : quiz.difficulty === 'Intermediate'
                            ? 'amber'
                            : 'violet'
                        }
                      >
                        {quiz.difficulty || 'Basic'}
                      </Badge>
                    </div>
                    <Badge variant="default">
                      <ClipboardList className="h-3 w-3" />
                      {quiz.question_count} Qs
                    </Badge>
                  </div>
                  <h2 className="mt-3 text-base font-bold text-navy-900 dark:text-white">
                    {language === 'kn' ? quiz.title_kn : quiz.title}
                  </h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {language === 'kn' ? quiz.description_kn : quiz.description}
                  </p>
                </div>
                <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-3.5 dark:border-navy-800">
                  <button
                    type="button"
                    onClick={() => startQuiz(quiz.id)}
                    className="lab-btn-primary text-xs"
                  >
                    {t('quizzes.startQuiz')}
                  </button>
                  <Link to={`/lab/${quiz.experiment_id}`} className="lab-btn-secondary text-xs">
                    Review Lab
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
