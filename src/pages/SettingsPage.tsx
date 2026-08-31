import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Settings as SettingsIcon,
  User,
  Building2,
  Sparkles,
  Database,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, refreshSession } = useAuth();
  const { activeCustomer } = useWorkspace();
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleResetDemoData = async () => {
    if (!window.confirm('Reset all demo jobs, candidates, and AI assessments to default seed state?')) return;
    setResetting(true);
    setMessage(null);
    try {
      await api.resetDemoData();
      await refreshSession();
      setMessage('Demo database successfully reset to clean Acme Recruitment seed state.');
    } catch (err) {
      console.error('Failed to reset demo:', err);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-emerald-600" />
          Settings & Account Overview
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your session credentials, workspace configurations, and AI capabilities.
        </p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* User Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400" />
          Active User Profile
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs text-slate-400 font-medium">Full Name</span>
            <p className="font-semibold text-slate-900 mt-0.5">{user?.full_name}</p>
          </div>

          <div>
            <span className="text-xs text-slate-400 font-medium">Email Address</span>
            <p className="font-semibold text-slate-900 mt-0.5">{user?.email}</p>
          </div>

          <div>
            <span className="text-xs text-slate-400 font-medium">Assigned System Role</span>
            <div className="mt-1">
              <Badge variant={user?.role === 'admin' ? 'warning' : 'primary'}>
                {user?.role === 'admin' ? 'TalentTrack Administrator' : 'Customer Recruiter'}
              </Badge>
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-400 font-medium">User ID</span>
            <p className="text-xs font-mono text-slate-600 mt-1">{user?.id}</p>
          </div>
        </div>
      </div>

      {/* Workspace Information */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          Current Workspace Organization
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs text-slate-400 font-medium">Organization Name</span>
            <p className="font-semibold text-slate-900 mt-0.5">
              {activeCustomer?.name || 'Default Workspace'}
            </p>
          </div>

          <div>
            <span className="text-xs text-slate-400 font-medium">Primary Contact</span>
            <p className="text-slate-800 mt-0.5">
              {activeCustomer?.contact_name} ({activeCustomer?.contact_email})
            </p>
          </div>

          <div>
            <span className="text-xs text-slate-400 font-medium">Workspace ID</span>
            <p className="text-xs font-mono text-slate-600 mt-1">
              {activeCustomer?.id || user?.customer_id || 'N/A'}
            </p>
          </div>

          <div>
            <span className="text-xs text-slate-400 font-medium">Data Isolation</span>
            <p className="text-xs text-emerald-700 font-medium mt-1">
              ✓ Protected by PostgreSQL Row Level Security (RLS)
            </p>
          </div>
        </div>
      </div>

      {/* AI & Infrastructure Settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          AI & Storage Engine
        </h3>

        <div className="space-y-3 text-xs text-slate-600">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <div>
              <p className="font-semibold text-slate-800">AI Assessment Engine</p>
              <p className="text-slate-500">Google Gemini Flash / Server-side evaluator</p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <div>
              <p className="font-semibold text-slate-800">Private CV Document Storage</p>
              <p className="text-slate-500">Encrypted storage with short-lived signed URLs</p>
            </div>
            <Badge variant="primary">Secured</Badge>
          </div>
        </div>
      </div>

      {/* Demo Maintenance Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-400" />
              Demo Data Reset
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Restore the initial 3 jobs and 10 candidates for Acme Recruitment.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetDemoData}
            loading={resetting}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Reset Demo Data
          </Button>
        </div>
      </div>
    </div>
  );
};
