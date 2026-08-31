import React, { useState, useEffect } from 'react';
import { Job } from '../types/database';
import { api } from '../lib/api';
import { useWorkspace } from '../context/WorkspaceContext';
import { JobListTable } from '../components/jobs/JobListTable';
import { JobFormModal } from '../components/jobs/JobFormModal';
import { Button } from '../components/ui/Button';
import { Plus, Briefcase, RefreshCw } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';

export const JobsPage: React.FC = () => {
  const { activeCustomerId } = useWorkspace();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await api.getJobs(activeCustomerId);
      setJobs(data);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [activeCustomerId]);

  const handleCreateOrUpdate = async (jobData: Partial<Job>) => {
    if (editingJob) {
      const updated = await api.updateJob(editingJob.id, jobData, activeCustomerId);
      setJobs(prev => prev.map(j => (j.id === editingJob.id ? updated : j)));
    } else {
      const created = await api.createJob(jobData, activeCustomerId);
      setJobs(prev => [created, ...prev]);
    }
    setEditingJob(null);
  };

  const handleToggleStatus = async (job: Job) => {
    const nextStatus = job.status === 'Closed' ? 'Open' : 'Closed';
    try {
      const updated = await api.updateJob(job.id, { status: nextStatus }, activeCustomerId);
      setJobs(prev => prev.map(j => (j.id === job.id ? updated : j)));
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-emerald-600" />
            Job Openings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your open positions, requirements, and hiring statuses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchJobs}
            disabled={loading}
            title="Refresh jobs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            onClick={() => {
              setEditingJob(null);
              setIsModalOpen(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Create Job
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <JobListTable
          jobs={jobs}
          onEdit={job => {
            setEditingJob(job);
            setIsModalOpen(true);
          }}
          onToggleStatus={handleToggleStatus}
        />
      )}

      {/* Create / Edit Modal */}
      <JobFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingJob(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingJob}
      />
    </div>
  );
};
