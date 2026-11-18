import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  FileSpreadsheet,
  MessageSquare,
  Plus,
  Share2,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';

const ROLES = [
  { id: 'researcher', title: 'STEM Researcher', desc: 'Investigates background theory, formulas, and hypothesis' },
  { id: 'operator', title: 'Experiment Operator', desc: 'Sets input parameters and executes simulation trials' },
  { id: 'analyst', title: 'Data Analyst', desc: 'Analyzes tables, verifies calculations, and computes error margins' },
  { id: 'presenter', title: 'Lead Presenter', desc: 'Synthesizes conclusions, real-world relevance, and peer review' },
];

export default function StemCollabModal({ open, onClose, experimentId, experimentTitle }) {
  const [teamName, setTeamName] = useState('Newton Science Explorers');
  const [members, setMembers] = useState({
    researcher: 'Priya S.',
    operator: 'Rahul K.',
    analyst: 'Amina M.',
    presenter: 'Kavitha R.',
  });
  const [teamHypothesis, setTeamHypothesis] = useState('');
  const [teamFindings, setTeamFindings] = useState('');
  const [peerReviewNote, setPeerReviewNote] = useState('');
  const [savedProjects, setSavedProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('current');

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('labxai_stem_collab_projects') || '[]');
      setSavedProjects(stored);
      // Auto populate if existing project for this experiment
      const match = stored.find((p) => p.experimentId === experimentId);
      if (match) {
        setTeamName(match.teamName || 'Newton Science Explorers');
        setMembers(match.members || members);
        setTeamHypothesis(match.teamHypothesis || '');
        setTeamFindings(match.teamFindings || '');
        setPeerReviewNote(match.peerReviewNote || '');
      }
    } catch {
      // ignore
    }
  }, [experimentId, open]);

  if (!open) return null;

  const handleSaveProject = () => {
    const project = {
      id: `${experimentId}_${Date.now()}`,
      experimentId,
      experimentTitle: experimentTitle || experimentId,
      teamName,
      members,
      teamHypothesis,
      teamFindings,
      peerReviewNote,
      updatedAt: new Date().toLocaleDateString(),
    };

    const updated = [project, ...savedProjects.filter((p) => p.experimentId !== experimentId)];
    setSavedProjects(updated);
    try {
      localStorage.setItem('labxai_stem_collab_projects', JSON.stringify(updated));
    } catch {
      // ignore
    }
    setActiveTab('list');
  };

  const handleDeleteProject = (projId) => {
    const updated = savedProjects.filter((p) => p.id !== projId);
    setSavedProjects(updated);
    try {
      localStorage.setItem('labxai_stem_collab_projects', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-elevated dark:border-navy-700 dark:bg-navy-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-navy-800 dark:bg-navy-950">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                STEM Team Collaboration Hub
              </h3>
              <p className="text-xs text-slate-500">
                Assign roles, record group hypotheses, and co-author findings for {experimentTitle}.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-navy-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 px-6 pt-2 dark:border-navy-800">
          <button
            type="button"
            onClick={() => setActiveTab('current')}
            className={`border-b-2 px-4 py-2 text-xs font-bold transition ${
              activeTab === 'current'
                ? 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-300'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Active Project Workspace
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`border-b-2 px-4 py-2 text-xs font-bold transition ${
              activeTab === 'list'
                ? 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-300'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Saved Team Projects ({savedProjects.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'current' ? (
            <div className="space-y-4">
              {/* Team Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Team Name / Investigation Group
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g., Curie Physics Squad"
                  className="lab-input mt-1 text-xs"
                />
              </div>

              {/* 4 Assigned STEM Roles */}
              <div>
                <h4 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Assigned Team Roles
                </h4>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {ROLES.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-navy-800 dark:bg-navy-950/40"
                    >
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-violet-600" />
                        <span className="text-xs font-bold text-navy-900 dark:text-white">
                          {r.title}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-slate-400">{r.desc}</p>
                      <input
                        type="text"
                        value={members[r.id] || ''}
                        onChange={(e) =>
                          setMembers((prev) => ({ ...prev, [r.id]: e.target.value }))
                        }
                        placeholder="Student name"
                        className="lab-input mt-2 py-1 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Group Hypothesis */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Collaborative Group Hypothesis
                </label>
                <textarea
                  rows={2}
                  value={teamHypothesis}
                  onChange={(e) => setTeamHypothesis(e.target.value)}
                  placeholder="What does your team hypothesize will happen before running trials?"
                  className="lab-input mt-1 text-xs"
                />
              </div>

              {/* Shared Findings & Conclusion */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Shared Team Findings & Conclusions
                </label>
                <textarea
                  rows={2}
                  value={teamFindings}
                  onChange={(e) => setTeamFindings(e.target.value)}
                  placeholder="Synthesize what the team observed across all parameter trials..."
                  className="lab-input mt-1 text-xs"
                />
              </div>

              {/* Peer Review Note */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Peer Review & Teacher Feedback
                </label>
                <textarea
                  rows={2}
                  value={peerReviewNote}
                  onChange={(e) => setPeerReviewNote(e.target.value)}
                  placeholder="Notes from another team reviewing your methodology and results..."
                  className="lab-input mt-1 text-xs"
                />
              </div>

              {/* Save / Persist button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveProject}
                  className="lab-btn-primary w-full justify-center py-2 text-xs font-bold"
                >
                  <Share2 className="h-4 w-4" />
                  Save & Publish Team Project Report
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {savedProjects.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-500">
                  No collaborative team projects saved yet. Create one in the Active Project Workspace tab!
                </p>
              ) : (
                savedProjects.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 p-4 dark:border-navy-800 dark:bg-navy-950/60"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-navy-900 dark:text-white">
                            {p.teamName}
                          </h4>
                          <span className="rounded bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                            {p.experimentTitle}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Members: {Object.values(p.members || {}).filter(Boolean).join(', ')} · Updated {p.updatedAt}
                        </p>
                        {p.teamHypothesis && (
                          <p className="mt-2 text-xs text-slate-700 dark:text-slate-300">
                            <span className="font-semibold">Hypothesis:</span> {p.teamHypothesis}
                          </p>
                        )}
                        {p.teamFindings && (
                          <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                            <span className="font-semibold">Findings:</span> {p.teamFindings}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteProject(p.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                        title="Delete project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
