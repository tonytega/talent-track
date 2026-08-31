import React, { useState } from 'react';
import { Candidate, AIAssessment } from '../../types/database';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
import {
  Sparkles,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  RotateCw,
} from 'lucide-react';

interface AIAssessmentViewProps {
  candidate: Candidate;
  assessment?: AIAssessment | null;
  onAssessmentCompleted: (assessment: AIAssessment) => void;
}

export const AIAssessmentView: React.FC<AIAssessmentViewProps> = ({
  candidate,
  assessment,
  onAssessmentCompleted,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunAssessment = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.runAIAssessment(candidate.id, candidate.job_id);
      onAssessmentCompleted(result);
    } catch (err: any) {
      console.error('AI Assessment error:', err);
      setError(err.message || 'AI assessment failed. You can retry or continue reviewing the profile manually.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-300 ring-emerald-400/20';
    if (score >= 60) return 'text-amber-700 bg-amber-50 border-amber-300 ring-amber-400/20';
    return 'text-rose-700 bg-rose-50 border-rose-300 ring-rose-400/20';
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-emerald-50/20 border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-600 rounded-lg text-white shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm tracking-tight">
              AI CV Assessment & Role Fit
            </h4>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated analysis comparing candidate CV with job specifications.
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleRunAssessment}
          loading={loading}
          icon={assessment ? <RotateCw className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
          className="shadow-xs shrink-0"
        >
          {assessment ? 'Re-run AI Assessment' : 'Assess CV with AI'}
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">AI Assessment Unavailable</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Assessment Content or Empty state */}
      {assessment ? (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Score & Summary Banner */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Score Ring */}
            <div
              className={`w-20 h-20 shrink-0 rounded-2xl border-2 flex flex-col items-center justify-center font-black ${getScoreColor(
                assessment.score
              )}`}
            >
              <span className="text-2xl leading-none">{assessment.score}</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase opacity-80 mt-0.5">
                Match
              </span>
            </div>

            {/* Summary narrative */}
            <div className="space-y-1">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Executive Fit Summary
              </h5>
              <p className="text-xs text-slate-700 leading-relaxed">{assessment.summary}</p>
            </div>
          </div>

          {/* Strengths & Potential Gaps 2-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="bg-white rounded-xl border border-emerald-100 p-4 space-y-2.5 shadow-2xs">
              <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Key Strengths
              </h5>
              <ul className="space-y-2">
                {assessment.strengths.map((str, idx) => (
                  <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Potential Gaps */}
            <div className="bg-white rounded-xl border border-amber-100 p-4 space-y-2.5 shadow-2xs">
              <h5 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Potential Gaps & Questions
              </h5>
              <ul className="space-y-2">
                {assessment.gaps.map((gap, idx) => (
                  <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Ethics / Decision Support Notice */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-100/70 px-3 py-2 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>
              Decision support only. AI assessments do not make automated decisions or infer protected characteristics.
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-white/80 rounded-xl border border-dashed border-slate-300 p-8 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <h5 className="text-sm font-semibold text-slate-800">No AI Assessment Generated</h5>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click <strong>"Assess CV with AI"</strong> to automatically extract qualifications, calculate a match score, and generate interview pointers.
          </p>
        </div>
      )}
    </div>
  );
};
