import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Dashboard } from '../Dashboard';

export const AdminWorkspacePage: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const { setActiveCustomerId } = useWorkspace();

  useEffect(() => {
    if (customerId) {
      setActiveCustomerId(customerId);
    }
  }, [customerId, setActiveCustomerId]);

  return <Dashboard />;
};
