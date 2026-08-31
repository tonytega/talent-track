import React, { useState } from 'react';
import { Job } from '../../types/database';
import { Button } from '../ui/Button';
import { getStatusColor, formatDate } from '../../lib/utils';
import {
  MapPin,
  Clock,
  DollarSign,
  Users,
  Edit2,
  Lock,
  Unlock,
  ChevronRight,
  Link2,
  Check,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface JobListTableProps {
  jobs: Job[];
  onEdit: (job: Job) => void;
  onToggleStatus: (job: Job) => void;
}

export const JobListTable: React.FC<JobListTableProps> = ({
  jobs,
  onEdit,
  onToggleStatus,
}) => {
  const navigate = useNavigate();
  const [copiedJobId, setCopiedJobId] = useState<string | null>(null);

  const copyApplicationLink = (job: Job) => {
    const url = `${window.location.origin}/apply/${job.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedJobId(job.id);
      setTimeout(() => setCopiedJobId(null), 2500);
    });
  };

  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <Users className="w-6 h-6" />
        </div>
        <h4 className="text-base font-semibold text-slate-900">No Job Openings Yet</h4>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
          Create your first job opening to start sourcing and organizing candidate pipelines.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th scope="col" className="px-6 py-3.5">Job Title</th>
              <th scope="col" className="px-6 py-3.5">Status</th>
              <th scope="col" className="px-6 py-3.5">Location & Type</th>
              <th scope="col" className="px-6 py-3.5">Salary Range</th>
              <th scope="col" className="px-6 py-3.5 text-center">Candidates</th>
              <th scope="col" className="px-6 py-3.5">Date Created</th>
              <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {jobs.map(job => (
              <tr
                key={job.id}
                className="hover:bg-slate-50/70 transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {job.title}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 max-w-sm">
                    {job.description}
                  </p>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                      job.status
                    )}`}
                  >
                    {job.status}
                  </span>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-0.5 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {job.employment_type}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                  {job.salary_range ? (
                    <span className="flex items-center gap-1 font-medium text-slate-800">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      {job.salary_range}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Unspecified</span>
                  )}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => navigate(`/candidates?jobId=${job.id}`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-full font-semibold text-xs transition-colors"
                    title="View candidate pipeline"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{job.candidate_count ?? 0}</span>
                  </button>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                  {formatDate(job.created_at)}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-right space-x-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(job)}
                    className="p-1.5 h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                    title="Edit Job"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>

                  {job.status === 'Open' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyApplicationLink(job)}
                      className={`p-1.5 h-8 w-8 transition-colors ${
                        copiedJobId === job.id
                          ? 'text-emerald-600 bg-emerald-50'
                          : 'text-blue-500 hover:text-blue-700 hover:bg-blue-50'
                      }`}
                      title="Copy Application Link"
                    >
                      {copiedJobId === job.id ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Link2 className="w-4 h-4" />
                      )}
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleStatus(job)}
                    className={`p-1.5 h-8 w-8 ${
                      job.status === 'Closed'
                        ? 'text-emerald-600 hover:bg-emerald-50'
                        : 'text-amber-600 hover:bg-amber-50'
                    }`}
                    title={job.status === 'Closed' ? 'Reopen Job' : 'Close Job'}
                  >
                    {job.status === 'Closed' ? (
                      <Unlock className="w-4 h-4" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/candidates?jobId=${job.id}`)}
                    className="text-xs"
                  >
                    Pipeline <ChevronRight className="w-3 h-3 ml-0.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
