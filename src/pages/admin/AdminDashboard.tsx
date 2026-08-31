import React, { useState, useEffect } from 'react';
import { Customer } from '../../types/database';
import { api } from '../../lib/api';
import { CustomerListTable } from '../../components/admin/CustomerListTable';
import { CreateCustomerModal } from '../../components/admin/CreateCustomerModal';
import { CreateAdminModal } from '../../components/admin/CreateAdminModal';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  Building2,
  Users,
  Shield,
  Plus,
  RefreshCw,
  Briefcase,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const totalJobs = customers.reduce((acc, c) => acc + (c.jobs_count || 0), 0);
  const totalCandidates = customers.reduce((acc, c) => acc + (c.candidates_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-600" />
            TalentTrack Administration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage customer workspaces, provision recruiter accounts, and configure global settings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCustomers}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsAdminModalOpen(true)}
            icon={<Shield className="w-4 h-4 text-amber-600" />}
          >
            + Create Admin
          </Button>

          <Button
            onClick={() => setIsCustomerModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Create Customer
          </Button>
        </div>
      </div>

      {/* Admin Stat Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Customer Workspaces
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {loading ? (
              <Skeleton className="h-8 w-14" />
            ) : (
              <span className="text-3xl font-extrabold text-slate-900">{customers.length}</span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Managed Jobs
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {loading ? (
              <Skeleton className="h-8 w-14" />
            ) : (
              <span className="text-3xl font-extrabold text-slate-900">{totalJobs}</span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Candidates
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {loading ? (
              <Skeleton className="h-8 w-14" />
            ) : (
              <span className="text-3xl font-extrabold text-slate-900">{totalCandidates}</span>
            )}
          </div>
        </div>
      </div>

      {/* Customer Workspaces Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Active Customer Workspaces</h2>
          <span className="text-xs text-slate-500">
            Click "Open Workspace" to manage a customer's specific ATS pipeline
          </span>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <CustomerListTable customers={customers} />
        )}
      </div>

      {/* Modals */}
      <CreateCustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onCustomerCreated={fetchCustomers}
      />

      <CreateAdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onAdminCreated={fetchCustomers}
      />
    </div>
  );
};
