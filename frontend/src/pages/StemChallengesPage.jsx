import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Atom,
  Award,
  CheckCircle2,
  ChevronRight,
  Compass,
  Cpu,
  Layers,
  Lightbulb,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  Trophy,
  Wrench,
  X,
  XCircle,
} from 'lucide-react';
import { STEM_CHALLENGES } from '../data/stemChallengesData';
import PageHeader from '../components/ui/PageHeader';
import { Badge } from '../components/StatusStates';

export default function StemChallengesPage() {
  const [selectedChallenge, setSelectedChallenge] = useState(STEM_CHALLENGES[0]);
  const [challengeParams, setChallengeParams] = useState(() => {
    const init = {};
    STEM_CHALLENGES[0].parameters.forEach((p) => {
      init[p.name] = p.default;
    });
    return init;
  });
  const [evalResult, setEvalResult] = useState(null);
  const [reflectionAnswer, setReflectionAnswer] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [completedMap, setCompletedMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('labxai_stem_completed_challenges') || '{}');
    } catch {
      return {};
    }
  });

  const selectChallenge = (ch) => {
    setSelectedChallenge(ch);
    const init = {};
    ch.parameters.forEach((p) => {
      init[p.name] = p.default;
    });
    setChallengeParams(init);
    setEvalResult(null);
    setReflectionAnswer('');
  };

  const handleParamChange = (name, val) => {
    setChallengeParams((prev) => ({ ...prev, [name]: parseFloat(val) }));
    setEvalResult(null); // Clear previous result until user tests again
  };

  const handleTestPrototype = () => {
    if (!selectedChallenge) return;
    const res = selectedChallenge.evaluateSolution(challengeParams);
    setEvalResult(res);

    if (res.success) {
      const updated = {
        ...completedMap,
        [selectedChallenge.id]: {
          score: res.score,
          completedAt: new Date().toISOString(),
        },
      };
      setCompletedMap(updated);
      try {
        localStorage.setItem('labxai_stem_completed_challenges', JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  };

  const filteredChallenges = STEM_CHALLENGES.filter((c) => {
    if (filterDifficulty === 'all') return true;
    return c.difficulty.toLowerCase() === filterDifficulty.toLowerCase();
  });

  const completedCount = Object.keys(completedMap).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'STEM Challenges' },
        ]}
        title="STEM Engineering Challenges"
        subtitle="Apply Science, Technology, Engineering, and Mathematics to solve real-world problem scenarios under realistic physical constraints."
        rightSlot={
          <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-1.5 dark:border-amber-800 dark:bg-amber-950/60">
            <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="font-mono text-xs font-bold text-amber-900 dark:text-amber-200">
              {completedCount} / {STEM_CHALLENGES.length} Completed
            </span>
          </div>
        }
      />

      {/* Difficulty Filter Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {['all', 'Basic', 'Intermediate', 'Advanced'].map((lvl) => (
          <button
            key={lvl}
            type="button"
            onClick={() => setFilterDifficulty(lvl)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              filterDifficulty.toLowerCase() === lvl.toLowerCase()
                ? 'bg-navy-900 text-white shadow-sm dark:bg-blue-600'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-300'
            }`}
          >
            {lvl === 'all' ? 'All Challenges' : `${lvl} Challenges`}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Challenges List (5 cols) */}
        <div className="space-y-3 lg:col-span-5">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Select a Real-World Challenge
          </h3>

          <div className="space-y-2.5">
            {filteredChallenges.map((ch) => {
              const isSelected = selectedChallenge?.id === ch.id;
              const isDone = Boolean(completedMap[ch.id]);

              return (
                <div
                  key={ch.id}
                  onClick={() => selectChallenge(ch)}
                  className={`group cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 shadow-sm dark:border-blue-500 dark:bg-blue-950/50'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-navy-800 dark:bg-navy-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            ch.difficulty === 'Basic'
                              ? 'emerald'
                              : ch.difficulty === 'Intermediate'
                              ? 'amber'
                              : 'rose'
                          }
                        >
                          {ch.difficulty}
                        </Badge>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {ch.durationMinutes} min
                        </span>
                        {isDone && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" /> Solved
                          </span>
                        )}
                      </div>

                      <h4 className="mt-2 text-sm font-bold text-navy-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-sky-300">
                        {ch.title}
                      </h4>
                    </div>

                    <ChevronRight
                      className={`h-4 w-4 shrink-0 transition-transform ${
                        isSelected ? 'translate-x-1 text-blue-600' : 'text-slate-300'
                      }`}
                    />
                  </div>

                  <p className="mt-1 text-xs text-slate-600 line-clamp-2 dark:text-slate-300">
                    {ch.problemStatement}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2.5 dark:border-navy-800">
                    {ch.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-navy-800 dark:text-slate-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Challenge Workspace (7 cols) */}
        <div className="lg:col-span-7">
          {selectedChallenge ? (
            <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-navy-800 dark:bg-navy-900">
              {/* Header */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="blue">{selectedChallenge.discipline}</Badge>
                  <span className="font-mono text-xs font-bold text-slate-500">
                    Estimated time: {selectedChallenge.durationMinutes} mins
                  </span>
                </div>
                <h2 className="mt-2 text-xl font-black text-navy-900 dark:text-white">
                  {selectedChallenge.title}
                </h2>
              </div>

              {/* Problem Statement Box */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  <Lightbulb className="h-4 w-4" />
                  Real-World Challenge Brief
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-amber-950 dark:text-amber-100">
                  {selectedChallenge.problemStatement}
                </p>
              </div>

              {/* Interdisciplinary Connections */}
              <div className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-xs dark:border-navy-800 dark:bg-navy-950/40 sm:grid-cols-2">
                <div>
                  <span className="font-bold text-blue-600">Science: </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {selectedChallenge.connections.science}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-emerald-600">Technology: </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {selectedChallenge.connections.technology}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-amber-600">Engineering: </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {selectedChallenge.connections.engineering}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-purple-600">Mathematics: </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {selectedChallenge.connections.mathematics}
                  </span>
                </div>
              </div>

              {/* Physical Constraints Checklist */}
              <div>
                <h4 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Engineering Constraints
                </h4>
                <div className="space-y-2">
                  {selectedChallenge.constraints.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 p-2.5 text-xs text-slate-700 dark:border-navy-800 dark:text-slate-300"
                    >
                      <div className="h-2 w-2 rounded-full bg-blue-600" />
                      <span>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Prototype Parameter Sliders */}
              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-5 dark:border-navy-800 dark:bg-navy-950/40">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900 dark:text-white">
                    Tune Prototype Parameters
                  </h4>
                  <Sliders className="h-4 w-4 text-slate-400" />
                </div>

                {selectedChallenge.parameters.map((param) => {
                  const val = challengeParams[param.name] ?? param.default;
                  return (
                    <div key={param.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {param.label}
                        </span>
                        <span className="font-mono font-bold text-blue-700 dark:text-sky-300">
                          {val} {param.unit}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        value={val}
                        onChange={(e) => handleParamChange(param.name, e.target.value)}
                        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 dark:bg-navy-700"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>{param.min} {param.unit}</span>
                        <span>{param.max} {param.unit}</span>
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={handleTestPrototype}
                  className="lab-btn-primary w-full justify-center py-2.5 text-xs font-bold"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Test Prototype Against Physical Constraints
                </button>
              </div>

              {/* Evaluation Outcome & Telemetry Readout */}
              {evalResult && (
                <div
                  className={`rounded-xl border p-5 transition-all ${
                    evalResult.success
                      ? 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/40'
                      : 'border-rose-200 bg-rose-50/80 dark:border-rose-900 dark:bg-rose-950/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {evalResult.success ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                      )}
                      <h4
                        className={`text-sm font-bold ${
                          evalResult.success
                            ? 'text-emerald-900 dark:text-emerald-200'
                            : 'text-rose-900 dark:text-rose-200'
                        }`}
                      >
                        {evalResult.success
                          ? 'Design Prototype Succeeded!'
                          : 'Design Constraints Not Satisfied'}
                      </h4>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 font-mono text-xs font-bold ${
                        evalResult.success
                          ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200'
                          : 'bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-200'
                      }`}
                    >
                      Score: {evalResult.score} / 100
                    </span>
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    {evalResult.message}
                  </p>

                  {evalResult.suggestion && (
                    <div className="mt-3 rounded-lg border border-slate-200/60 bg-white/60 p-2.5 text-xs font-medium text-slate-700 dark:border-navy-700 dark:bg-navy-900/60 dark:text-slate-300">
                      <span className="font-bold text-blue-700 dark:text-sky-300">
                        Engineering Recommendation:{' '}
                      </span>
                      {evalResult.suggestion}
                    </div>
                  )}

                  {/* Reflection Question */}
                  <div className="mt-4 border-t border-slate-200/60 pt-3 dark:border-navy-800">
                    <label className="text-xs font-bold text-navy-900 dark:text-white">
                      Engineering Reflection Question:
                    </label>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                      {selectedChallenge.reflection}
                    </p>
                    <textarea
                      rows={2}
                      value={reflectionAnswer}
                      onChange={(e) => setReflectionAnswer(e.target.value)}
                      placeholder="Type your reflection..."
                      className="lab-input mt-2 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 text-center text-slate-400">
              <Compass className="mb-2 h-8 w-8" />
              <p className="text-xs">Select a STEM challenge from the left to start.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
