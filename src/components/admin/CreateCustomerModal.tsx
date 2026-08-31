import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated: () => void;
}

export const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({
  isOpen,
  onClose,
  onCustomerCreated,
}) => {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !contactName.trim() || !contactEmail.trim()) {
      setError('Please provide company name, contact name, and contact email.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.createCustomer({
        name: companyName.trim(),
        contact_name: contactName.trim(),
        contact_email: contactEmail.trim(),
        password,
      });
      onCustomerCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create customer account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Customer Account"
      description="Provision a new isolated customer organization and recruiter login."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <Input
          label="Company Name *"
          placeholder="e.g. Acme Recruitment or Horizon Labs"
          value={companyName}
          onChange={e => setCompanyName(e.target.value)}
          required
        />

        <Input
          label="Recruiter / Contact Full Name *"
          placeholder="e.g. Sarah Jenkins"
          value={contactName}
          onChange={e => setContactName(e.target.value)}
          required
        />

        <Input
          label="Recruiter Email Address *"
          type="email"
          placeholder="recruiter@acme.com"
          value={contactEmail}
          onChange={e => setContactEmail(e.target.value)}
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
            Create Customer Account
          </Button>
        </div>
      </form>
    </Modal>
  );
};
