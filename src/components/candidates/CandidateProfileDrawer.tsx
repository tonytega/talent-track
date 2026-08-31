import React, { useState, useEffect } from 'react';
import { Candidate, CandidateStage, AIAssessment } from '../../types/database';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Input';
import { ResumeUpload } from './ResumeUpload';
import { AIAssessmentView } from './AIAssessmentView';
import { STAGES, getStageColor, formatDate } from '../../lib/utils';
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Globe,
  Calendar,
  Save,
  Edit2,
  Trash2,
  Check,
} from 'lucide-react';

interface CandidateProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  onUpdateCandidate: (candidateId: string, updates: Partial<Candidate>) => Promise<void>;
  onDeleteCandidate: (candidateId: string) => Promise<void>;
  onEditClick: (candidate: Candidate) => void;
}

export const CandidateProfileDrawer: React.FC<CandidateProfileDrawerProps> = ({
  isOpen,
  onClose,
  candidate,
  onUpdateCandidate,
  onDeleteCandidate,
  onEditClick,
}) => {
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [latestAssessment, setLatestAssessment] = useState<AIAssessment | null>(null);

  useEffect(() => {
    if (candidate) {
      setNotes(candidate.notes || '');
      setLatestAssessment(candidate.latest_assessment || null);
    }
  }, [candidate]);

  if (!candidate) return null;

  const handleStageChange = async (newStage: CandidateStage) => {
    await onUpdateCandidate(candidate.id, { stage: newStage });
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await onUpdateCandidate(candidate.id, { notes });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleAssessmentCompleted = (assessment: AIAssessment) => {
    setLatestAssessment(assessment);
  };

  const stageStyle = getStageColor(candidate.stage);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`${candidate.first_name} ${candidate.last_name}`}
      subtitle={`Application for ${candidate.job_title || 'Open Position'}`}
      width="2xl"
    >
      <div className="space-y-6">
        {/* Top Action Bar: Stage Picker & Edit/Delete */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Stage:
            </span>
            <div className="w-40">
              <select
                value={candidate.stage}
                onChange={e => handleStageChange(e.target.value as CandidateStage)}
                className={`w-full text-xs font-bold px-3 py-1.5 rounded-lg border cursor-pointer outline-none transition-colors ${stageStyle.bg} ${stageStyle.text} ${stageStyle.border}`}
              >
                {STAGES.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditClick(candidate)}
              icon={<Edit2 className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Edit Profile
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete ${candidate.first_name} ${candidate.last_name}?`)) {
                  onDeleteCandidate(candidate.id);
                  onClose();
                }
              }}
              icon={<Trash2 className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Personal & Contact Information Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Contact & Location Details
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2.5 text-slate-700">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <a
                href={`mailto:${candidate.email}`}
                className="text-emerald-700 hover:underline truncate"
              >
                {candidate.email}
              </a>
            </div>

            <div className="flex items-center gap-2.5 text-slate-700">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{candidate.phone || <span className="text-slate-400 italic">No phone</span>}</span>
            </div>

            <div className="flex items-center gap-2.5 text-slate-700">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{candidate.location || <span className="text-slate-400 italic">No location specified</span>}</span>
            </div>

            <div className="flex items-center gap-2.5 text-slate-700">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Added on {formatDate(candidate.created_at)}</span>
            </div>
          </div>

          {/* Professional Links */}
          {(candidate.linkedin_url || candidate.portfolio_url) && (
            <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-4">
              {candidate.linkedin_url && (
                <a
                  href={candidate.linkedin_url.startsWith('http') ? candidate.linkedin_url : `https://${candidate.linkedin_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                  LinkedIn Profile
                </a>
              )}
              {candidate.portfolio_url && (
                <a
                  href={candidate.portfolio_url.startsWith('http') ? candidate.portfolio_url : `https://${candidate.portfolio_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Portfolio / GitHub
                </a>
              )}
            </div>
          )}
        </div>

        {/* Resume Section */}
        <ResumeUpload
          candidate={candidate}
          onCandidateUpdated={updated => {
            onUpdateCandidate(candidate.id, updated);
          }}
        />

        {/* AI Assessment Section */}
        <AIAssessmentView
          candidate={candidate}
          assessment={latestAssessment}
          onAssessmentCompleted={handleAssessmentCompleted}
        />

        {/* Recruiter Notes Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Recruiter Notes & Feedback
            </h4>
            {notesSaved && (
              <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Saved
              </span>
            )}
          </div>

          <Textarea
            placeholder="Record screening answers, interview scores, salary expectations..."
            rows={4}
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />

          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveNotes}
              loading={savingNotes}
              icon={<Save className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Save Notes
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  );
};
