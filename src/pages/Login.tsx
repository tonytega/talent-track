import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import {
  Lock,
  Mail,
  Sparkles,
  Shield,
  Building2,
  AlertCircle,
} from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoading(true);
    setError(null);
    try {
      await login(demoEmail, demoPass);
      navigate(demoEmail.includes('admin') ? '/admin' : '/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient gradient glow */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-emerald-500/20">
            T
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">TalentTrack</h2>
            <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Modern Lightweight ATS
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900">Sign in to your account</h3>
            <p className="text-xs text-slate-500 mt-1">
              Access your recruitment pipeline and candidate evaluations.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@company.com"
              icon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              icon={<Lock className="w-4 h-4" />}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />

            <Button type="submit" className="w-full" loading={loading}>
              Sign In
            </Button>
          </form>

          {/* Demo Login Quick-Fill Helper */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
              Quick Demo Accounts (1-Click)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@talenttrack.io', 'Password123!')}
                className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <Shield className="w-3.5 h-3.5 text-amber-700" /> Admin Demo
                </div>
                <p className="text-[10px] text-amber-800/80 mt-0.5 truncate">admin@talenttrack.io</p>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('recruiter@acme.com', 'Password123!')}
                className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <Building2 className="w-3.5 h-3.5 text-emerald-700" /> Recruiter Demo
                </div>
                <p className="text-[10px] text-emerald-800/80 mt-0.5 truncate">recruiter@acme.com</p>
              </button>
            </div>
            <p className="text-[11px] text-center text-slate-400">
              Demo accounts have full sample jobs, 10 candidates & AI evaluations pre-loaded.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
