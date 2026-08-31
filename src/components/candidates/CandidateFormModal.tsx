import React, { useState, useEffect } from 'react';
import { Candidate, Job, CandidateStage } from '../../types/database';
import { Modal } from '../ui/Modal';
import { Input, Textarea } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { STAGES } from '../../lib/utils';
import { UploadCloud, FileText } from 'lucide-react';

interface CandidateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (candidateData: Partial<Candidate>, resumeFile?: File) => Promise<void>;
  jobs: Job[];
  initialData?: Candidate | null;
  defaultJobId?: string;
}

export const CandidateFormModal: React.FC<CandidateFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  jobs,
  initialData,
  defaultJobId,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [jobId, setJobId] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [stage, setStage] = useState<CandidateStage>('Applied');
  const [notes, setNotes] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFirstName(initialData.first_name);
      setLastName(initialData.last_name);
      setEmail(initialData.email);
      setJobId(initialData.job_id);
      setPhone(initialData.phone || '');
      setLocation(initialData.location || '');
      setLinkedinUrl(initialData.linkedin_url || '');
      setPortfolioUrl(initialData.portfolio_url || '');
      setStage(initialData.stage);
      setNotes(initialData.notes || '');
    } else {
      setFirstName('');
      setLastName('');
      setEmail('');
      setJobId(defaultJobId || (jobs.length > 0 ? jobs[0].id : ''));
      setPhone('');
      setLocation('');
      setLinkedinUrl('');
      setPortfolioUrl('');
      setStage('Applied');
      setNotes('');
    }
    setResumeFile(null);
    setError(null);
  }, [initialData, defaultJobId, jobs, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validExts = ['.pdf', '.docx', '.doc'];
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!validExts.includes(fileExt)) {
        setError('Resume must be a PDF or DOCX file.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Resume file size cannot exceed 5MB.');
        return;
      }
      setError(null);
      setResumeFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !jobId) {
      setError('Please provide First Name, Last Name, Email, and assign a Job.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit(
        {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          job_id: jobId,
          phone: phone.trim() || null,
          location: location.trim() || null,
          linkedin_url: linkedinUrl.trim() || null,
          portfolio_url: portfolioUrl.trim() || null,
          stage,
          notes: notes.trim() || null,
        },
        resumeFile || undefined
      );
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save candidate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Candidate Profile' : 'Add New Candidate'}
      description="Enter candidate credentials, contact details, and initial recruiter notes."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="First Name *"
            placeholder="e.g. Jane"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            required
          />
          <Input
            label="Last Name *"
            placeholder="e.g. Doe"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Email Address *"
            type="email"
            placeholder="jane.doe@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <Input
            label="Phone Number"
            placeholder="+1 (555) 019-2834"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Target Job Opening *"
            value={jobId}
            onChange={e => setJobId(e.target.value)}
            required
          >
            <option value="" disabled>Select Job</option>
            {jobs.map(j => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.status})
              </option>
            ))}
          </Select>

          <Select
            label="Initial Stage *"
            value={stage}
            onChange={e => setStage(e.target.value as CandidateStage)}
            options={STAGES.map(s => ({ value: s, label: s }))}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Location"
            placeholder="e.g. London, UK or Remote"
            value={location}
            onChange={e => setLocation(e.target.value)}
          />
          <Input
            label="LinkedIn URL"
            placeholder="https://linkedin.com/in/username"
            value={linkedinUrl}
            onChange={e => setLinkedinUrl(e.target.value)}
          />
        </div>

        <Input
          label="Portfolio / GitHub URL"
          placeholder="https://github.com/username or https://myportfolio.com"
          value={portfolioUrl}
          onChange={e => setPortfolioUrl(e.target.value)}
        />

        {/* Resume upload area */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Resume / CV (PDF or DOCX, max 5MB)
          </label>
          <div className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50">
            <input
              type="file"
              id="resume-upload-input"
              className="hidden"
              accept=".pdf,.docx,.doc"
              onChange={handleFileChange}
            />
            <label htmlFor="resume-upload-input" className="cursor-pointer block">
              {resumeFile ? (
                <div className="flex items-center justify-center gap-2 text-emerald-700 font-medium text-sm">
                  <FileText className="w-5 h-5" />
                  <span>{resumeFile.name} ({(resumeFile.size / 1024).toFixed(0)} KB)</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-slate-500">
                  <UploadCloud className="w-6 h-6 text-slate-400" />
                  <span className="text-xs font-medium text-slate-700">
                    Click to select resume or drag and drop
                  </span>
                  <span className="text-[11px] text-slate-400">PDF, DOCX up to 5MB</span>
                </div>
              )}
            </label>
          </div>
        </div>

        <Textarea
          label="Recruiter Notes"
          placeholder="Initial thoughts, referral sources, interview remarks..."
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {initialData ? 'Update Candidate' : 'Add Candidate'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
