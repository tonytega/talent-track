import React from 'react';
import { Candidate, CandidateStage } from '../../types/database';
import { STAGES } from '../../lib/utils';
import { KanbanColumn } from './KanbanColumn';

interface KanbanBoardProps {
  candidates: Candidate[];
  onSelectCandidate: (candidate: Candidate) => void;
  onUpdateCandidateStage: (candidateId: string, newStage: CandidateStage) => Promise<void>;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  candidates,
  onSelectCandidate,
  onUpdateCandidateStage,
}) => {
  const handleDropCandidate = (candidateId: string, targetStage: CandidateStage) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (candidate && candidate.stage !== targetStage) {
      onUpdateCandidateStage(candidateId, targetStage);
    }
  };

  const handleMoveCandidate = (candidate: Candidate, newStage: CandidateStage) => {
    if (candidate.stage !== newStage) {
      onUpdateCandidateStage(candidate.id, newStage);
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start">
      {STAGES.map(stage => {
        const stageCandidates = candidates.filter(c => c.stage === stage);
        return (
          <KanbanColumn
            key={stage}
            stage={stage}
            candidates={stageCandidates}
            onSelectCandidate={onSelectCandidate}
            onMoveCandidate={handleMoveCandidate}
            onDropCandidate={handleDropCandidate}
          />
        );
      })}
    </div>
  );
};
