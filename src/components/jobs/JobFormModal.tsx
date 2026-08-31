import React, { useState, useEffect } from 'react';
import { Job, EmploymentType, JobStatus } from '../../types/database';
import { Modal } from '../ui/Modal';
import { Input, Textarea } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

interface JobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (jobData: Partial<Job>) => Promise<void>;
  initialData?: Job | null;
}

export const JobFormModal: React.FC<JobFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('Full-time');
  const [salaryRange, setSalaryRange] = useState('');
  const [status, setStatus] = useState<JobStatus>('Open');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setLocation(initialData.location);
      setEmploymentType(initialData.employment_type);
      setSalaryRange(initialData.salary_range || '');
      setStatus(initialData.status);
    } else {
      setTitle('');
      setDescription('');
      setLocation('');
      setEmploymentType('Full-time');
      setSalaryRange('');
      setStatus('Open');
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !location.trim()) {
      setError('Please fill in all required fields (Title, Description, Location).');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        employment_type: employmentType,
        salary_range: salaryRange.trim() || null,
        status,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Job Opening' : 'Create New Job Opening'}
      description="Define the requirements, location, and compensation for this role."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <Input
          label="Job Title *"
          placeholder="e.g. Senior Frontend Engineer"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Location *"
            placeholder="e.g. London, UK (Hybrid) or Remote"
            value={location}
            onChange={e => setLocation(e.target.value)}
            required
          />

          <Select
            label="Employment Type *"
            value={employmentType}
            onChange={e => setEmploymentType(e.target.value as EmploymentType)}
            options={[
              { value: 'Full-time', label: 'Full-time' },
              { value: 'Part-time', label: 'Part-time' },
              { value: 'Contract', label: 'Contract' },
              { value: 'Internship', label: 'Internship' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Salary Range (Optional)"
            placeholder="e.g. $120,000 - $150,000 or £75k"
            value={salaryRange}
            onChange={e => setSalaryRange(e.target.value)}
          />

          <Select
            label="Status *"
            value={status}
            onChange={e => setStatus(e.target.value as JobStatus)}
            options={[
              { value: 'Draft', label: 'Draft' },
              { value: 'Open', label: 'Open' },
              { value: 'Closed', label: 'Closed' },
            ]}
          />
        </div>

        <Textarea
          label="Job Description & Requirements *"
          placeholder="Describe key responsibilities, deliverables, required tech stack, and qualifications..."
          rows={5}
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {initialData ? 'Save Changes' : 'Publish Job'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
