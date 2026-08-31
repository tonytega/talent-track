import React from 'react';
import { Customer } from '../../types/database';
import { Button } from '../ui/Button';
import { formatDate } from '../../lib/utils';
import {
  Building2,
  Mail,
  User,
  Briefcase,
  Users,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext';

interface CustomerListTableProps {
  customers: Customer[];
}

export const CustomerListTable: React.FC<CustomerListTableProps> = ({ customers }) => {
  const navigate = useNavigate();
  const { setActiveCustomerId } = useWorkspace();

  const handleEnterWorkspace = (customer: Customer) => {
    setActiveCustomerId(customer.id);
    navigate(`/admin/customers/${customer.id}`);
  };

  if (customers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <Building2 className="w-6 h-6" />
        </div>
        <h4 className="text-base font-semibold text-slate-900">No Customers Provisioned</h4>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
          Create your first customer account to begin managing recruitment workspaces.
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
              <th scope="col" className="px-6 py-3.5">Company Name</th>
              <th scope="col" className="px-6 py-3.5">Contact Details</th>
              <th scope="col" className="px-6 py-3.5 text-center">Active Jobs</th>
              <th scope="col" className="px-6 py-3.5 text-center">Total Candidates</th>
              <th scope="col" className="px-6 py-3.5">Created Date</th>
              <th scope="col" className="px-6 py-3.5 text-right">Workspace Access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map(c => (
              <tr key={c.id} className="hover:bg-slate-50/70 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center border border-emerald-200/60 shrink-0">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {c.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono">ID: {c.id.substring(0, 8)}...</p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex flex-col text-xs text-slate-600">
                    <span className="font-medium text-slate-800 flex items-center gap-1.5">
                      <User className="w-3 h-3 text-slate-400" />
                      {c.contact_name}
                    </span>
                    <span className="text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {c.contact_email}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4 text-center whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-semibold text-xs border border-blue-100">
                    <Briefcase className="w-3 h-3" />
                    {c.active_jobs_count ?? 0}
                  </span>
                </td>

                <td className="px-6 py-4 text-center whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full font-semibold text-xs border border-emerald-100">
                    <Users className="w-3 h-3" />
                    {c.candidates_count ?? 0}
                  </span>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                  {formatDate(c.created_at)}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <Button
                    onClick={() => handleEnterWorkspace(c)}
                    size="sm"
                    className="text-xs bg-amber-600 hover:bg-amber-700 text-white focus-visible:ring-amber-500"
                    icon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    Open Workspace <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
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
