import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  ClipboardList,
  FlaskConical,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { labApi } from '../api/client';
import { useApp } from '../context/AppContext';
import { Badge, ErrorState, LoadingState } from '../components/StatusStates';

export default function QuizzesPage() {
  const { language, studentId, addToast, t } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterExperiment = searchParams.get('experiment');

  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadQuizzes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await labApi.listQuizzes();
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
  }, [filterExperiment]);

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

  const handleSubmit = async () => {
    if (!activeQuiz) return;
    setSubmitting(true);
    try {
      const res = await labApi.submitQuiz(activeQuiz.id, { studentId, answers });
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
              <Badge variant={result.passed ? 'emerald' : 'amber'}>
                {result.passed ? t('quizzes.passed') : t('quizzes.needsReview')}
              </Badge>
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
                      <p className="text-slate-600 dark:text-slate-300">
                        Your answer:{' '}
                        <span className="font-semibold">
                          {item.selected_index !== null ? opts[item.selected_index] : 'Unanswered'}
                        </span>
                      </p>
                      {!item.is_correct && (
                        <p className="text-emerald-700 dark:text-emerald-400">
                          Correct answer:{' '}
                          <span className="font-semibold">{opts[item.correct_index]}</span>
                        </p>
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
    const options = language === 'kn' ? question.options_kn : question.options;
    const selectedIdx = answers[question.id];
    const total = activeQuiz.questions.length;
    const answeredCount = Object.keys(answers).length;

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
          <h1 className="text-lg font-bold text-navy-900 dark:text-white">
            {language === 'kn' ? activeQuiz.title_kn : activeQuiz.title}
          </h1>

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

          <div className="mt-5 space-y-3">
            {options.map((opt, idx) => {
              const isSelected = selectedIdx === idx;
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
                {submitting ? t('quizzes.submitting') : `${t('quizzes.submitQuiz')} (${answeredCount}/${total})`}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Quiz Catalog View
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-navy-900 dark:text-white sm:text-3xl">
          {t('quizzes.title')}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t('quizzes.subtitle')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="lab-card flex flex-col justify-between p-6">
            <div>
              <div className="flex items-center justify-between gap-2">
                <Badge variant="violet">
                  <ClipboardList className="h-3.5 w-3.5" />
                  {quiz.question_count} {t('quizzes.questionsCount')}
                </Badge>
                <Badge variant="default">Pass: {quiz.passing_score}%</Badge>
              </div>
              <h2 className="mt-3 text-xl font-bold text-navy-900 dark:text-white">
                {language === 'kn' ? quiz.title_kn : quiz.title}
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {language === 'kn' ? quiz.description_kn : quiz.description}
              </p>
            </div>
            <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-navy-800">
              <button type="button" onClick={() => startQuiz(quiz.id)} className="lab-btn-primary">
                {t('quizzes.startQuiz')}
              </button>
              <Link to={`/lab/${quiz.experiment_id}`} className="lab-btn-secondary text-xs">
                Review Lab First
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
