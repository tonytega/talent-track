import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { LogOut, User, Building2, Shield, Menu } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const { activeCustomer } = useWorkspace();

  return (
    <header className="bg-white border-b border-slate-200 h-16 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm font-bold text-base">
            T
          </div>
          <span className="font-bold text-slate-900 text-lg tracking-tight">TalentTrack</span>
          <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
            ATS MVP
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Workspace Pill */}
        {activeCustomer && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-200 text-xs font-medium text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Workspace: <strong className="text-slate-900">{activeCustomer.name}</strong></span>
          </div>
        )}

        {/* User Role Badge */}
        {user?.role === 'admin' ? (
          <Badge variant="warning" size="sm" className="hidden sm:inline-flex gap-1">
            <Shield className="w-3 h-3" /> Admin
          </Badge>
        ) : (
          <Badge variant="primary" size="sm" className="hidden sm:inline-flex">
            Recruiter
          </Badge>
        )}

        {/* Profile info & Logout */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xs">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-900 leading-tight">{user?.full_name}</p>
              <p className="text-[11px] text-slate-500 truncate max-w-[140px]">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
