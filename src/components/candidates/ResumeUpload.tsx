import React, { useState } from 'react';
import { Candidate } from '../../types/database';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
import {
  FileText,
  UploadCloud,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface ResumeUploadProps {
  candidate: Candidate;
  onCandidateUpdated: (updated: Candidate) => void;
}

export const ResumeUpload: React.FC<ResumeUploadProps> = ({
  candidate,
  onCandidateUpdated,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    const validExtensions = ['.pdf', '.docx', '.doc'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      setError('Invalid file format. Please upload a PDF or DOCX file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File exceeds 5MB limit.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.uploadResume(candidate.id, file);
      onCandidateUpdated(res.candidate);
      setSuccess('Resume uploaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to upload CV.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const signedUrl = await api.getResumeDownloadUrl(candidate.id);
      window.open(signedUrl, '_blank');
    } catch (err: any) {
      setError(err.message || 'Failed to generate download link.');
    }
  };

  return (
    <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-emerald-600" />
          Resume / CV Document
        </h4>
        {candidate.resume_path && (
          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Attached
          </span>
        )}
      </div>

      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {candidate.resume_path ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {candidate.resume_path.split('/').pop() || 'candidate_cv.pdf'}
              </p>
              <p className="text-[11px] text-slate-400">Private encrypted cloud storage</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              icon={<Download className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Download
            </Button>

            <div>
              <input
                type="file"
                id="replace-resume-input"
                className="hidden"
                accept=".pdf,.docx,.doc"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <label
                htmlFor="replace-resume-input"
                className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-medium rounded-lg gap-1.5 bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent cursor-pointer transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${uploading ? 'animate-spin' : ''}`} />
                <span>Replace</span>
              </label>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-5 text-center transition-colors bg-white">
          <input
            type="file"
            id="initial-resume-input"
            className="hidden"
            accept=".pdf,.docx,.doc"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <label
            htmlFor="initial-resume-input"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            <div className="p-2.5 bg-slate-100 rounded-full text-slate-500">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">
                {uploading ? 'Uploading document...' : 'Upload Candidate Resume'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">PDF or DOCX (up to 5MB)</p>
            </div>
          </label>
        </div>
      )}
    </div>
  );
};
