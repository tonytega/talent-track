import React, { useState } from 'react';
import { Candidate, CandidateStage } from '../../types/database';
import { CandidateCard } from './CandidateCard';
import { getStageColor } from '../../lib/utils';

interface KanbanColumnProps {
  stage: CandidateStage;
  candidates: Candidate[];
  onSelectCandidate: (candidate: Candidate) => void;
  onMoveCandidate: (candidate: Candidate, newStage: CandidateStage) => void;
  onDropCandidate: (candidateId: string, targetStage: CandidateStage) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  stage,
  candidates,
  onSelectCandidate,
  onMoveCandidate,
  onDropCandidate,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const stageTheme = getStageColor(stage);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const candidateId = e.dataTransfer.getData('text/plain');
    if (candidateId) {
      onDropCandidate(candidateId, stage);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col rounded-xl border transition-all min-w-[280px] w-[280px] sm:w-72 md:w-80 shrink-0 bg-slate-100/70 ${
        isDragOver
          ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-400/20'
          : 'border-slate-200'
      }`}
    >
      {/* Column Header */}
      <div className="p-3.5 border-b border-slate-200/80 bg-white/80 rounded-t-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${stageTheme.dot}`} />
          <h3 className="font-bold text-slate-800 text-sm">{stage}</h3>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-bold ${stageTheme.badge}`}
        >
          {candidates.length}
        </span>
      </div>

      {/* Cards List Container */}
      <div className="p-3 flex-1 flex flex-col gap-3 min-h-[450px] max-h-[calc(100vh-280px)] overflow-y-auto">
        {candidates.length === 0 ? (
          <div className="h-28 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-xs text-slate-400">
            Drop candidate here
          </div>
        ) : (
          candidates.map(cand => (
            <CandidateCard
              key={cand.id}
              candidate={cand}
              onClick={() => onSelectCandidate(cand)}
              onMoveStage={onMoveCandidate}
            />
          ))
        )}
      </div>
    </div>
  );
};
