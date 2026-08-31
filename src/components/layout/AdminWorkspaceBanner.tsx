import React from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';

export const AdminWorkspaceBanner: React.FC = () => {
  const { activeCustomer, isAdminViewingWorkspace, clearAdminWorkspace } = useWorkspace();
  const navigate = useNavigate();

  if (!isAdminViewingWorkspace || !activeCustomer) return null;

  const handleReturn = () => {
    clearAdminWorkspace();
    navigate('/admin');
  };

  return (
    <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-4 py-2.5 shadow-md flex flex-wrap items-center justify-between gap-3 text-sm z-30 sticky top-0">
      <div className="flex items-center gap-2.5 font-medium">
        <span className="flex items-center justify-center p-1 bg-amber-500/40 rounded-md">
          <ShieldCheck className="w-4 h-4 text-amber-100" />
        </span>
        <span className="text-amber-100">Admin Mode:</span>
        <span className="font-semibold text-white flex items-center gap-1.5 bg-amber-800/50 px-2.5 py-0.5 rounded-full border border-amber-500/30">
          <Building2 className="w-3.5 h-3.5" />
          Viewing workspace: {activeCustomer.name}
        </span>
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={handleReturn}
        className="bg-white/95 text-amber-900 hover:bg-white hover:text-amber-950 font-semibold shadow-sm border-0"
        icon={<ArrowLeft className="w-3.5 h-3.5" />}
      >
        Return to Admin Dashboard
      </Button>
    </div>
  );
};
