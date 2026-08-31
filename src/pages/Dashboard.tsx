import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Candidate, Job, DashboardStats } from '../types/database';
import { api } from '../lib/api';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { getStageColor, formatDate } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import {
  Briefcase,
  Users,
  UserCheck,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Building2,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeCustomer, activeCustomerId } = useWorkspace();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentCandidates, setRecentCandidates] = useState<Candidate[]>([]);
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardStats(activeCustomerId);
      setStats(data.stats);
      setRecentCandidates(data.recent_candidates);
      setActiveJobs(data.active_jobs);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeCustomerId]);

  const statCards = [
    {
      title: 'Active Jobs',
      value: stats?.active_jobs ?? 0,
      icon: Briefcase,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
      action: () => navigate('/jobs'),
    },
    {
      title: 'Total Candidates',
      value: stats?.total_candidates ?? 0,
      icon: Users,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      action: () => navigate('/candidates'),
    },
    {
      title: 'In Interview',
      value: stats?.in_interview ?? 0,
      icon: UserCheck,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
      action: () => navigate('/candidates'),
    },
    {
      title: 'Hired Candidates',
      value: stats?.hired ?? 0,
      icon: CheckCircle,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      action: () => navigate('/candidates'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Recruiter'}! 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-slate-400" />
            Workspace:{' '}
            <strong className="text-slate-800">
              {activeCustomer?.name || 'Acme Recruitment'}
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            onClick={() => navigate('/candidates')}
            icon={<Users className="w-4 h-4" />}
          >
            Open Kanban Board
          </Button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={card.action}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {card.title}
                </span>
                <div className={`p-2 rounded-lg border ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                {loading ? (
                  <Skeleton className="h-8 w-14" />
                ) : (
                  <span className="text-3xl font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors">
                    {card.value}
                  </span>
                )}
                <span className="text-xs font-medium text-slate-400 group-hover:text-slate-600 flex items-center gap-0.5">
                  View <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Recent Candidates & Active Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Candidates */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Recent Candidates</h3>
              <p className="text-xs text-slate-500">Latest applicants added to your pipeline</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/candidates')}
              className="text-xs"
            >
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>

          <div className="flex-1 p-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : recentCandidates.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No candidates added yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentCandidates.map(c => {
                  const stageStyle = getStageColor(c.stage);
                  return (
                    <div
                      key={c.id}
                      onClick={() => navigate(`/candidates?candidateId=${c.id}`)}
                      className="py-3 px-3 -mx-3 rounded-lg hover:bg-slate-50 flex items-center justify-between gap-3 cursor-pointer transition-colors group"
                    >
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {c.first_name} {c.last_name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {c.job_title || 'General Applicant'} • Added {formatDate(c.created_at)}
                        </p>
                      </div>

                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${stageStyle.badge}`}
                      >
                        {c.stage}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Active Jobs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Active Jobs</h3>
              <p className="text-xs text-slate-500">Currently open positions with candidate counts</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/jobs')}
              className="text-xs"
            >
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>

          <div className="flex-1 p-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : activeJobs.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No active jobs open.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activeJobs.map(job => (
                  <div
                    key={job.id}
                    onClick={() => navigate(`/candidates?jobId=${job.id}`)}
                    className="py-3 px-3 -mx-3 rounded-lg hover:bg-slate-50 flex items-center justify-between gap-3 cursor-pointer transition-colors group"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {job.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {job.location} • {job.employment_type}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200/70">
                        {job.candidate_count ?? 0} Candidates
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
