import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser } from '../types/database';
import { api } from '../lib/api';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshSession = async () => {
    try {
      const userId = localStorage.getItem('talenttrack_user_id');
      if (!userId) {
        setUser(null);
        setLoading(false);
        return;
      }
      const data = await api.getSession();
      setUser(data.user);
    } catch (err) {
      console.warn('Session expired or invalid:', err);
      localStorage.removeItem('talenttrack_token');
      localStorage.removeItem('talenttrack_user_id');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    localStorage.setItem('talenttrack_token', data.token);
    localStorage.setItem('talenttrack_user_id', data.user.id);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('talenttrack_token');
    localStorage.removeItem('talenttrack_user_id');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
