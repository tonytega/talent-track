import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Customer } from '../types/database';
import { api } from '../lib/api';

interface WorkspaceContextType {
  activeCustomerId: string | null;
  activeCustomer: Customer | null;
  setActiveCustomerId: (id: string | null) => void;
  isAdminViewingWorkspace: boolean;
  clearAdminWorkspace: () => void;
  loadingWorkspace: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [adminSelectedCustomerId, setAdminSelectedCustomerId] = useState<string | null>(null);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState<boolean>(false);

  const isAdmin = user?.role === 'admin';
  const effectiveCustomerId = isAdmin ? adminSelectedCustomerId : user?.customer_id || null;
  const isAdminViewingWorkspace = Boolean(isAdmin && adminSelectedCustomerId);

  useEffect(() => {
    async function loadCustomer() {
      if (!effectiveCustomerId) {
        setActiveCustomer(null);
        return;
      }
      setLoadingWorkspace(true);
      try {
        if (isAdmin) {
          const customers = await api.getAdminCustomers();
          const found = customers.find(c => c.id === effectiveCustomerId) || null;
          setActiveCustomer(found);
        } else if (user?.customer) {
          setActiveCustomer(user.customer);
        }
      } catch (err) {
        console.error('Failed to load workspace customer:', err);
      } finally {
        setLoadingWorkspace(false);
      }
    }

    loadCustomer();
  }, [effectiveCustomerId, isAdmin, user]);

  const clearAdminWorkspace = () => {
    setAdminSelectedCustomerId(null);
    setActiveCustomer(null);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        activeCustomerId: effectiveCustomerId,
        activeCustomer,
        setActiveCustomerId: setAdminSelectedCustomerId,
        isAdminViewingWorkspace,
        clearAdminWorkspace,
        loadingWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within a WorkspaceProvider');
  return context;
};
