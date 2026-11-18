import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  RotateCcw,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { getStemConnections } from '../data/stemConnectionsData';

export default function StemPredictSection({
  experimentId,
  discipline,
  lastSimResult,
  onPredictionConfirmed,
}) {
  const stem = getStemConnections(experimentId, discipline);
  const prompt = stem?.predictPrompt;

  const [selectedOption, setSelectedOption] = useState(null);
  const [customReasoning, setCustomReasoning] = useState('');
  const [predictionLocked, setPredictionLocked] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // Load existing prediction if already saved for this experiment
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`labxai_pred_${experimentId}`) || 'null');
      if (saved) {
        setSelectedOption(saved.selectedOption);
        setCustomReasoning(saved.customReasoning || '');
        setPredictionLocked(saved.locked);
        setRevealed(saved.revealed);
      } else {
        setSelectedOption(null);
        setCustomReasoning('');
        setPredictionLocked(false);
        setRevealed(false);
      }
    } catch {
      // fallback
    }
  }, [experimentId]);

  // When a new simulation completes and student has a locked prediction, reveal comparison!
  useEffect(() => {
    if (predictionLocked && lastSimResult && !revealed) {
      setRevealed(true);
      const isCorrect = selectedOption?.correct;
      // Persist to localStorage
      try {
        localStorage.setItem(
          `labxai_pred_${experimentId}`,
          JSON.stringify({
            selectedOption,
            customReasoning,
            locked: true,
            revealed: true,
            timestamp: new Date().toISOString(),
          })
        );
        // Track overall STEM predictions
        const allPreds = JSON.parse(localStorage.getItem('labxai_stem_predictions_log') || '[]');
        allPreds.push({
          experimentId,
          isCorrect,
          timestamp: new Date().toISOString(),
        });
        localStorage.setItem('labxai_stem_predictions_log', JSON.stringify(allPreds));
      } catch {
        // ignore storage errors
      }
      if (onPredictionConfirmed) {
        onPredictionConfirmed(isCorrect);
      }
    }
  }, [lastSimResult, predictionLocked, revealed, selectedOption, customReasoning, experimentId, onPredictionConfirmed]);

  const handleLockPrediction = () => {
    if (!selectedOption) return;
    setPredictionLocked(true);
    try {
      localStorage.setItem(
        `labxai_pred_${experimentId}`,
        JSON.stringify({
          selectedOption,
          customReasoning,
          locked: true,
          revealed: false,
        })
      );
    } catch {
      // fallback
    }
  };

  const handleReset = () => {
    setSelectedOption(null);
    setCustomReasoning('');
    setPredictionLocked(false);
    setRevealed(false);
    try {
      localStorage.removeItem(`labxai_pred_${experimentId}`);
    } catch {
      // fallback
    }
  };

  if (!prompt) return null;

  const isCorrect = selectedOption?.correct;

  return (
    <div className="mb-6 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-white to-sky-50/70 p-4 shadow-sm dark:border-navy-700 dark:from-navy-900 dark:via-navy-900/90 dark:to-blue-950/40 sm:p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-3 dark:border-navy-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <BrainCircuit className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-navy-900 dark:text-white">
              STEM Critical Thinking: Predict Before Running
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              True scientists formulate hypotheses before testing them with real data.
            </p>
          </div>
        </div>

        {revealed && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400"
          >
            <RotateCcw className="h-3 w-3" />
            Try Another Hypothesis
          </button>
        )}
      </div>

      {/* Question */}
      <div className="mt-3.5">
        <p className="text-xs font-semibold text-navy-900 dark:text-white">
          {prompt.question}
        </p>

        {/* Options */}
        <div className="mt-2.5 space-y-2">
          {prompt.options.map((opt) => {
            const isSelected = selectedOption?.id === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                disabled={predictionLocked}
                onClick={() => setSelectedOption(opt)}
                className={`flex w-full items-start gap-2.5 rounded-xl border p-2.5 text-left text-xs font-medium transition ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 dark:border-blue-500 dark:bg-blue-950/60 dark:text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-300'
                } ${predictionLocked ? 'cursor-default opacity-90' : 'cursor-pointer'}`}
              >
                <div
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-300 dark:border-navy-600'
                  }`}
                >
                  {isSelected ? '✓' : ''}
                </div>
                <span className="flex-1 leading-snug">{opt.text}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Reasoning Input (Optional) */}
        {!predictionLocked && (
          <div className="mt-3">
            <input
              type="text"
              value={customReasoning}
              onChange={(e) => setCustomReasoning(e.target.value)}
              placeholder="Why do you predict this? (Optional scientific reasoning)"
              className="lab-input py-1.5 text-xs"
            />
          </div>
        )}

        {/* Lock / Submit Button */}
        {!predictionLocked && (
          <div className="mt-3.5 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500">
              {selectedOption ? 'Ready to test!' : 'Select an option to lock in your hypothesis.'}
            </span>
            <button
              type="button"
              disabled={!selectedOption}
              onClick={handleLockPrediction}
              className="lab-btn-primary py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Lock in Prediction & Run Simulation
            </button>
          </div>
        )}

        {/* Waiting State */}
        {predictionLocked && !revealed && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 p-2.5 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            <HelpCircle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              Prediction locked! Now adjust parameters and run the simulation below to verify your hypothesis against real calculations.
            </span>
          </div>
        )}

        {/* Revealed Outcome & Analysis */}
        {revealed && (
          <div
            className={`mt-4 rounded-xl border p-3.5 ${
              isCorrect
                ? 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/40'
                : 'border-rose-200 bg-rose-50/80 dark:border-rose-900/60 dark:bg-rose-950/40'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs text-emerald-900 dark:text-emerald-200">
                    Hypothesis Confirmed by Simulation Data!
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  <span className="text-xs text-rose-900 dark:text-rose-200">
                    Hypothesis Refuted — A Great Scientific Learning Moment!
                  </span>
                </>
              )}
            </div>

            <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              {prompt.explanation}
            </p>

            {prompt.whatIfFollowUp && (
              <div className="mt-3 border-t border-slate-200/60 pt-2 text-[11px] font-medium text-slate-600 dark:border-navy-700 dark:text-slate-400">
                <span className="font-bold text-blue-700 dark:text-sky-300">What-If Challenge: </span>
                {prompt.whatIfFollowUp}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
