import React from 'react';
import { Candidate, CandidateStage } from '../../types/database';
import { STAGES, formatDate } from '../../lib/utils';
import {
  MapPin,
  Calendar,
  FileText,
  Sparkles,
  MessageSquare,
  MoreVertical,
} from 'lucide-react';

interface CandidateCardProps {
  candidate: Candidate;
  onClick: () => void;
  onMoveStage: (candidate: Candidate, newStage: CandidateStage) => void;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  onClick,
  onMoveStage,
}) => {
  const [showMoveMenu, setShowMoveMenu] = React.useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', candidate.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group select-none relative space-y-3"
    >
      {/* Top row: Name & Quick Stage Dropdown */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors text-sm leading-tight">
            {candidate.first_name} {candidate.last_name}
          </h4>
          <p className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-1 border border-emerald-100 max-w-[170px] truncate">
            {candidate.job_title || 'General Applicant'}
          </p>
        </div>

        <div className="relative" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setShowMoveMenu(!showMoveMenu)}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
            title="Move candidate stage"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMoveMenu && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setShowMoveMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-30 text-xs">
                <p className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Move Stage
                </p>
                {STAGES.map(stage => (
                  <button
                    key={stage}
                    onClick={() => {
                      setShowMoveMenu(false);
                      if (stage !== candidate.stage) onMoveStage(candidate, stage);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 hover:bg-slate-50 flex items-center justify-between ${
                      stage === candidate.stage ? 'font-semibold text-emerald-600 bg-emerald-50/50' : 'text-slate-700'
                    }`}
                  >
                    <span>{stage}</span>
                    {stage === candidate.stage && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Meta Information */}
      <div className="flex flex-col gap-1 text-[11px] text-slate-500">
        {candidate.location && (
          <span className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            {candidate.location}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
          Added {formatDate(candidate.created_at)}
        </span>
      </div>

      {/* Footer Badges: AI Score, Resume, Notes */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          {candidate.resume_path && (
            <span className="text-slate-500 hover:text-emerald-700" title="CV attached">
              <FileText className="w-3.5 h-3.5" />
            </span>
          )}
          {candidate.notes && (
            <span className="text-slate-400 hover:text-slate-700" title="Notes added">
              <MessageSquare className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        {candidate.latest_assessment ? (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[11px] ${
              candidate.latest_assessment.score >= 80
                ? 'bg-emerald-100 text-emerald-800'
                : candidate.latest_assessment.score >= 60
                ? 'bg-amber-100 text-amber-800'
                : 'bg-rose-100 text-rose-800'
            }`}
            title={`AI Match Score: ${candidate.latest_assessment.score}/100`}
          >
            <Sparkles className="w-3 h-3" />
            {candidate.latest_assessment.score}%
          </span>
        ) : (
          <span className="text-[11px] text-slate-400 italic">No AI score</span>
        )}
      </div>
    </div>
  );
};
