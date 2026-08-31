import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';

interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminCreated: () => void;
}

export const CreateAdminModal: React.FC<CreateAdminModalProps> = ({
  isOpen,
  onClose,
  onAdminCreated,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setError('Please provide full name and email.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.createAdmin({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
      });
      onAdminCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create admin account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Admin Account"
      description="Grant full administrative privileges across all customer workspaces."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <Input
          label="Full Name *"
          placeholder="e.g. Jordan Miller"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          required
        />

        <Input
          label="Admin Email Address *"
          type="email"
          placeholder="admin2@talenttrack.io"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <Input
          label="Initial Password *"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          helperText="Default: Password123!"
          required
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Admin Account
          </Button>
        </div>
      </form>
    </Modal>
  );
};
