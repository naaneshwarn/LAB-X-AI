import React from 'react';
import {
  Award,
  CheckCircle2,
  Compass,
  Download,
  FileText,
  Printer,
  Sparkles,
  X,
} from 'lucide-react';

export default function StemReportExport({
  open,
  onClose,
  experiment,
  parameters,
  measurements,
  observations,
  notes,
  studentId,
  stemData,
}) {
  if (!open || !experiment) return null;

  const handlePrint = () => {
    window.print();
  };

  const today = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 p-4 backdrop-blur-sm print:p-0">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-elevated dark:border-navy-700 dark:bg-navy-900 print:max-h-none print:w-full print:border-none print:shadow-none">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-navy-800 dark:bg-navy-950 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-bold text-navy-900 dark:text-white">
              Official STEM Experiment Report
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="lab-btn-primary py-1.5 text-xs font-semibold"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-navy-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div className="overflow-y-auto p-6 sm:p-8 print:overflow-visible print:p-6" id="stem-printable-report">
          {/* Institution & Lab Title */}
          <div className="border-b-2 border-navy-900 pb-4 dark:border-white">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-sky-400">
                  LabXAI Virtual Science Laboratories
                </span>
                <h1 className="text-2xl font-black text-navy-900 dark:text-white">
                  {experiment.title}
                </h1>
                <p className="mt-0.5 text-xs text-slate-500">
                  Discipline: {experiment.discipline || 'Science'} · Level: {experiment.difficulty} · Duration: {experiment.duration_minutes} min
                </p>
              </div>
              <div className="text-right">
                <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-bold text-slate-700 dark:bg-navy-800 dark:text-slate-300">
                  ID: {studentId}
                </span>
                <p className="mt-1 text-xs text-slate-400">{today}</p>
              </div>
            </div>
          </div>

          {/* STEM Interdisciplinary Connections */}
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-navy-800 dark:bg-navy-950/40">
            <h4 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-sky-400">
              Interdisciplinary STEM Framework
            </h4>
            <div className="grid gap-2 text-xs text-slate-700 sm:grid-cols-2 dark:text-slate-300">
              <div>
                <span className="font-bold text-blue-600">Science: </span>
                {stemData?.science || 'Natural phenomenon modeling.'}
              </div>
              <div>
                <span className="font-bold text-emerald-600">Technology: </span>
                {stemData?.technology || 'Sensor telemetry & digital tools.'}
              </div>
              <div>
                <span className="font-bold text-amber-600">Engineering: </span>
                {stemData?.engineering || 'Design prototypes & system constraints.'}
              </div>
              <div>
                <span className="font-bold text-purple-600">Mathematics: </span>
                {stemData?.mathematics || 'Governing equations & quantitative metrics.'}
              </div>
            </div>
          </div>

          {/* Experimental Parameters Tested */}
          <div className="mt-5">
            <h4 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Active Parameters
            </h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Object.entries(parameters || {}).map(([key, val]) => (
                <div key={key} className="rounded-xl border border-slate-200 p-2.5 dark:border-navy-800">
                  <div className="text-[10px] uppercase text-slate-400">{key}</div>
                  <div className="font-mono text-sm font-bold text-navy-900 dark:text-white">
                    {val}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recorded Observations Table */}
          <div className="mt-5">
            <h4 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Observation Data Log ({observations?.length || 0} Trials)
            </h4>
            {observations?.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-navy-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 dark:bg-navy-950 dark:text-slate-300">
                    <tr>
                      <th className="p-2">Trial #</th>
                      <th className="p-2">Timestamp</th>
                      <th className="p-2">Parameters</th>
                      <th className="p-2">Key Measured Outputs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                    {observations.map((obs, idx) => (
                      <tr key={obs.id || idx}>
                        <td className="p-2 font-mono font-bold">{observations.length - idx}</td>
                        <td className="p-2 font-mono text-slate-500">{obs.timestamp}</td>
                        <td className="p-2 font-mono">
                          {Object.entries(obs.parameters || {})
                            .map(([k, v]) => `${k}=${v}`)
                            .join(', ')}
                        </td>
                        <td className="p-2 font-mono font-semibold text-blue-700 dark:text-sky-300">
                          {Object.entries(obs.measurements || {})
                            .filter(([, v]) => typeof v === 'number' || typeof v === 'string')
                            .slice(0, 4)
                            .map(([k, v]) => `${k}=${v}`)
                            .join(' | ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs italic text-slate-400">No trials recorded yet.</p>
            )}
          </div>

          {/* Student Observations & Notes */}
          {notes && (
            <div className="mt-5">
              <h4 className="mb-1 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Student Notes & Qualitative Observations
              </h4>
              <p className="rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-700 dark:border-navy-800 dark:bg-navy-950 dark:text-slate-300">
                {notes}
              </p>
            </div>
          )}

          {/* Governing Scientific Formulas */}
          {experiment.formulas?.length > 0 && (
            <div className="mt-5">
              <h4 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Governing Equations
              </h4>
              <div className="flex flex-wrap gap-2">
                {experiment.formulas.map((f) => (
                  <span
                    key={f}
                    className="rounded-lg bg-sky-50 px-3 py-1 font-mono text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-sky-300"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Real World Impact */}
          {stemData?.realWorldCaseStudy && (
            <div className="mt-5 border-t border-slate-200 pt-4 dark:border-navy-800">
              <h4 className="text-xs font-bold text-navy-900 dark:text-white">
                Real-World Takeaway: {stemData.realWorldCaseStudy.title}
              </h4>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                {stemData.realWorldCaseStudy.description}
              </p>
            </div>
          )}

          {/* Signoff Footer */}
          <div className="mt-8 flex items-center justify-between border-t border-dashed border-slate-300 pt-4 text-[11px] text-slate-400">
            <span>Verified by LabXAI Deterministic Simulation Engine</span>
            <span>Student Signature: _______________________</span>
          </div>
        </div>
      </div>
    </div>
  );
}
