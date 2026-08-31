import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import {
  MapPin,
  Briefcase,
  DollarSign,
  Building2,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  ExternalLink,
} from 'lucide-react';

interface PublicJob {
  id: string;
  title: string;
  description: string;
  location: string;
  employment_type: string;
  salary_range: string | null;
  status: string;
  created_at: string;
  company_name: string;
}

type PageState = 'loading' | 'open' | 'closed' | 'not_found' | 'error' | 'success';

export const PublicApplyPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [job, setJob] = useState<PublicJob | null>(null);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!jobId) {
      setPageState('not_found');
      return;
    }
    api.getPublicJob(jobId)
      .then(data => {
        setJob(data);
        setPageState(data.status === 'Open' ? 'open' : 'closed');
      })
      .catch(err => {
        if (err.message?.includes('not found')) {
          setPageState('not_found');
        } else {
          setPageState('error');
        }
      });
  }, [jobId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedExts = ['.pdf', '.doc', '.docx'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
      setFormError('Please attach a PDF, DOC, or DOCX file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError('CV file size must be under 5MB.');
      return;
    }

    setFormError(null);
    setResumeFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Client-side validation
    if (!firstName.trim() || !lastName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (!resumeFile) {
      setFormError('Please attach your CV/Resume before submitting.');
      return;
    }

    const formData = new FormData();
    formData.append('first_name', firstName.trim());
    formData.append('last_name', lastName.trim());
    formData.append('email', email.trim().toLowerCase());
    if (phone.trim()) formData.append('phone', phone.trim());
    if (location.trim()) formData.append('location', location.trim());
    if (linkedinUrl.trim()) formData.append('linkedin_url', linkedinUrl.trim());
    if (portfolioUrl.trim()) formData.append('portfolio_url', portfolioUrl.trim());
    formData.append('resume', resumeFile);

    setSubmitting(true);
    try {
      await api.submitPublicApplication(jobId!, formData);
      setPageState('success');
    } catch (err: any) {
      setFormError(err.message || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render States ──

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
          <p className="text-slate-500 text-sm mt-3">Loading job details…</p>
        </div>
      </div>
    );
  }

  if (pageState === 'not_found') {
    return (
      <StatusScreen
        icon={<AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />}
        title="Job Not Found"
        message="This job listing doesn't exist or may have been removed."
      />
    );
  }

  if (pageState === 'error') {
    return (
      <StatusScreen
        icon={<AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />}
        title="Something Went Wrong"
        message="We couldn't load this job right now. Please try again later."
      />
    );
  }

  if (pageState === 'closed') {
    return (
      <StatusScreen
        icon={<Briefcase className="w-12 h-12 text-slate-400 mx-auto" />}
        title={`${job?.title ?? 'This Position'} Is No Longer Accepting Applications`}
        message={`${job?.company_name ?? 'The company'} has closed applications for this role. Please check back later for new openings.`}
        jobTitle={job?.title}
        companyName={job?.company_name}
      />
    );
  }

  if (pageState === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-10 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Application Submitted!</h2>
          <p className="text-slate-600 leading-relaxed">
            Application submitted successfully. Thank you for applying to{' '}
            <strong className="text-slate-900">{job?.title}</strong> at{' '}
            <strong className="text-slate-900">{job?.company_name}</strong>.
          </p>
          <p className="text-sm text-slate-500">
            The recruitment team will review your application and be in touch if your profile is a match.
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
              Powered by{' '}
              <span className="font-bold text-slate-600">TalentTrack</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Application Form ──

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header Branding */}
        <div className="text-center mb-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <div className="w-5 h-5 rounded bg-emerald-500 text-white font-black text-xs flex items-center justify-center">T</div>
            TalentTrack
          </span>
        </div>

        {/* Job Details Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-700">{job!.company_name}</p>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5 leading-tight">
                {job!.title}
              </h1>

              <div className="flex flex-wrap gap-3 mt-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {job!.location}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  {job!.employment_type}
                </span>
                {job!.salary_range && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    {job!.salary_range}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold">
                  Now Hiring
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">About This Role</h2>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {job!.description}
            </div>
          </div>
        </div>

        {/* Application Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Apply for this Position</h2>
            <p className="text-sm text-slate-500 mt-1">
              Complete the form below to submit your application. Fields marked <span className="text-rose-500 font-medium">*</span> are required.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Jane"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Smith"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jane.smith@example.com"
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* CV Upload */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                CV / Resume <span className="text-rose-500">*</span>
              </label>

              {resumeFile ? (
                <div className="flex items-center gap-3 p-3.5 rounded-lg border border-emerald-300 bg-emerald-50">
                  <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-emerald-800 truncate">{resumeFile.name}</p>
                    <p className="text-xs text-emerald-600">{(resumeFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setResumeFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="p-1 rounded-full hover:bg-emerald-200 text-emerald-700 transition-colors"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-slate-300 rounded-lg hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors group"
                >
                  <Upload className="w-7 h-7 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700 group-hover:text-emerald-700 transition-colors">
                      Click to upload your CV
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">PDF, DOC, or DOCX — max 5MB</p>
                  </div>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Optional Fields divider */}
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-400 font-medium">Optional information</span>
              </div>
            </div>

            {/* Phone + Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="New York, NY"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* LinkedIn + Portfolio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" /> LinkedIn URL
                </label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={e => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" /> Portfolio / Website
                </label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={e => setPortfolioUrl(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Error display */}
            {formError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting Application…
                </>
              ) : (
                'Apply Now'
              )}
            </button>

            <p className="text-center text-xs text-slate-400">
              By submitting this form, you consent to{' '}
              <strong className="text-slate-600">{job!.company_name}</strong> processing your
              information for recruitment purposes.
            </p>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center pb-6">
          <span className="text-xs text-slate-400">
            Recruitment powered by{' '}
            <Link to="/" className="font-semibold text-slate-600 hover:text-emerald-600 transition-colors">
              TalentTrack
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Shared status screen component ──
interface StatusScreenProps {
  icon: React.ReactNode;
  title: string;
  message: string;
  jobTitle?: string;
  companyName?: string;
}

const StatusScreen: React.FC<StatusScreenProps> = ({ icon, title, message }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-10 max-w-md w-full text-center space-y-4">
      {icon}
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
      <div className="pt-2">
        <span className="text-xs text-slate-400">
          Powered by <strong className="text-slate-600">TalentTrack</strong>
        </span>
      </div>
    </div>
  </div>
);
