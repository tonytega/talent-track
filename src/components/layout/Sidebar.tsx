import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Building2,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { user, logout } = useAuth();
  const { isAdminViewingWorkspace } = useWorkspace();

  const isAdmin = user?.role === 'admin';

  // In admin viewing customer workspace mode, links adapt to that customer's workspace context
  const dashboardLink = isAdmin && !isAdminViewingWorkspace ? '/admin' : '/dashboard';
  const jobsLink = '/jobs';
  const candidatesLink = '/candidates';
  const customersLink = '/admin/customers';
  const settingsLink = '/settings';

  const navItems = [
    {
      name: 'Dashboard',
      to: dashboardLink,
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: 'Customers',
      to: customersLink,
      icon: Building2,
      show: isAdmin && !isAdminViewingWorkspace,
    },
    {
      name: 'Jobs',
      to: jobsLink,
      icon: Briefcase,
      show: !isAdmin || isAdminViewingWorkspace,
    },
    {
      name: 'Candidates & Kanban',
      to: candidatesLink,
      icon: Users,
      show: !isAdmin || isAdminViewingWorkspace,
    },
    {
      name: 'Settings',
      to: settingsLink,
      icon: Settings,
      show: true,
    },
  ].filter(item => item.show);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 w-64 border-r border-slate-800">
      {/* Brand Header inside sidebar */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold text-base shadow-sm">
            TT
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-tight leading-none">TalentTrack</h1>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" /> AI-Assisted ATS
            </p>
          </div>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </p>

        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info & Logout */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        {isAdminViewingWorkspace && (
          <div className="bg-amber-950/60 border border-amber-800/40 rounded-lg p-2.5 text-xs text-amber-200">
            <p className="font-semibold">Admin Workspace View</p>
            <p className="text-[11px] text-amber-300/80 mt-0.5">Managing active customer</p>
          </div>
        )}

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
