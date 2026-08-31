import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Candidate, Job, CandidateStage } from '../types/database';
import { api } from '../lib/api';
import { useWorkspace } from '../context/WorkspaceContext';
import { KanbanBoard } from '../components/candidates/KanbanBoard';
import { CandidateFormModal } from '../components/candidates/CandidateFormModal';
import { CandidateProfileDrawer } from '../components/candidates/CandidateProfileDrawer';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Skeleton } from '../components/ui/Skeleton';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  X,
} from 'lucide-react';

export const CandidatesPage: React.FC = () => {
  const { activeCustomerId } = useWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedJobId, setSelectedJobId] = useState<string>(searchParams.get('jobId') || 'all');

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [selectedProfileCandidate, setSelectedProfileCandidate] = useState<Candidate | null>(null);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [jobsData, candidatesData] = await Promise.all([
        api.getJobs(activeCustomerId),
        api.getCandidates({ customerId: activeCustomerId }),
      ]);
      setJobs(jobsData);
      setCandidates(candidatesData);

      // If URL has candidateId param, open profile drawer automatically
      const candidateIdFromUrl = searchParams.get('candidateId');
      if (candidateIdFromUrl) {
        const match = candidatesData.find(c => c.id === candidateIdFromUrl);
        if (match) setSelectedProfileCandidate(match);
      }
    } catch (err) {
      console.error('Error fetching candidates data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [activeCustomerId]);

  // Sync selectedJobId from URL params if changed externally
  useEffect(() => {
    const paramJobId = searchParams.get('jobId');
    if (paramJobId) setSelectedJobId(paramJobId);
  }, [searchParams]);

  // Handle filter changes
  const handleJobFilterChange = (jobId: string) => {
    setSelectedJobId(jobId);
    if (jobId === 'all') {
      searchParams.delete('jobId');
    } else {
      searchParams.set('jobId', jobId);
    }
    setSearchParams(searchParams);
  };

  // Filtered Candidates (Combined Search + Job Filter)
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      // 1. Job Filter
      if (selectedJobId !== 'all' && c.job_id !== selectedJobId) {
        return false;
      }
      // 2. Text Search (first name, last name, full name, email)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
        const email = c.email.toLowerCase();
        const loc = (c.location || '').toLowerCase();
        return fullName.includes(q) || email.includes(q) || loc.includes(q);
      }
      return true;
    });
  }, [candidates, selectedJobId, searchQuery]);

  // Move candidate stage (Optimistic UI + API Persistence)
  const handleUpdateStage = async (candidateId: string, newStage: CandidateStage) => {
    const prevCandidates = [...candidates];

    // Optimistically update
    setCandidates(prev =>
      prev.map(c => (c.id === candidateId ? { ...c, stage: newStage } : c))
    );

    if (selectedProfileCandidate?.id === candidateId) {
      setSelectedProfileCandidate(prev => (prev ? { ...prev, stage: newStage } : null));
    }

    try {
      const updated = await api.updateCandidate(candidateId, { stage: newStage }, activeCustomerId);
      setCandidates(prev => prev.map(c => (c.id === candidateId ? updated : c)));
    } catch (err) {
      console.error('Failed to persist stage change, reverting:', err);
      setCandidates(prevCandidates);
      alert('Failed to update stage in database. Changes reverted.');
    }
  };

  // Add or edit candidate
  const handleSaveCandidate = async (data: Partial<Candidate>, resumeFile?: File) => {
    if (editingCandidate) {
      const updated = await api.updateCandidate(editingCandidate.id, data, activeCustomerId);
      if (resumeFile) {
        await api.uploadResume(updated.id, resumeFile);
      }
      setCandidates(prev => prev.map(c => (c.id === editingCandidate.id ? updated : c)));
      if (selectedProfileCandidate?.id === editingCandidate.id) {
        setSelectedProfileCandidate(updated);
      }
    } else {
      const created = await api.createCandidate(data, activeCustomerId);
      if (resumeFile) {
        await api.uploadResume(created.id, resumeFile);
      }
      setCandidates(prev => [created, ...prev]);
    }
    setEditingCandidate(null);
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    try {
      await api.deleteCandidate(candidateId, activeCustomerId);
      setCandidates(prev => prev.filter(c => c.id !== candidateId));
      if (selectedProfileCandidate?.id === candidateId) {
        setSelectedProfileCandidate(null);
      }
    } catch (err) {
      console.error('Failed to delete candidate:', err);
    }
  };

  const handleUpdateCandidateDetails = async (candidateId: string, updates: Partial<Candidate>) => {
    try {
      const updated = await api.updateCandidate(candidateId, updates, activeCustomerId);
      setCandidates(prev => prev.map(c => (c.id === candidateId ? updated : c)));
      if (selectedProfileCandidate?.id === candidateId) {
        setSelectedProfileCandidate(updated);
      }
    } catch (err) {
      console.error('Failed to update candidate details:', err);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            Candidate Pipeline
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track, move, evaluate, and search candidates across all recruitment stages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInitialData}
            disabled={loading}
            title="Refresh pipeline"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            onClick={() => {
              setEditingCandidate(null);
              setIsAddModalOpen(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Candidate
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Search input */}
        <div className="w-full md:w-80">
          <Input
            placeholder="Search candidates by name or email..."
            icon={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Job filter dropdown */}
        <div className="w-full md:w-64">
          <Select
            value={selectedJobId}
            onChange={e => handleJobFilterChange(e.target.value)}
          >
            <option value="all">All Jobs ({jobs.length})</option>
            {jobs.map(j => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.status})
              </option>
            ))}
          </Select>
        </div>

        {/* Clear filters & Metrics */}
        <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-3 md:ml-auto">
          {(searchQuery || selectedJobId !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                handleJobFilterChange('all');
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}

          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            Showing <strong className="text-slate-900">{filteredCandidates.length}</strong> of{' '}
            {candidates.length} Candidates
          </span>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="w-72 shrink-0 bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <KanbanBoard
          candidates={filteredCandidates}
          onSelectCandidate={cand => setSelectedProfileCandidate(cand)}
          onUpdateCandidateStage={handleUpdateStage}
        />
      )}

      {/* Add / Edit Candidate Modal */}
      <CandidateFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingCandidate(null);
        }}
        onSubmit={handleSaveCandidate}
        jobs={jobs}
        initialData={editingCandidate}
        defaultJobId={selectedJobId !== 'all' ? selectedJobId : undefined}
      />

      {/* Candidate Profile Drawer */}
      <CandidateProfileDrawer
        isOpen={Boolean(selectedProfileCandidate)}
        onClose={() => setSelectedProfileCandidate(null)}
        candidate={selectedProfileCandidate}
        onUpdateCandidate={handleUpdateCandidateDetails}
        onDeleteCandidate={handleDeleteCandidate}
        onEditClick={cand => {
          setSelectedProfileCandidate(null);
          setEditingCandidate(cand);
          setIsAddModalOpen(true);
        }}
      />
    </div>
  );
};
