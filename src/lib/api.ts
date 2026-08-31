import { AuthUser, Customer, Job, Candidate, AIAssessment, DashboardStats } from '../types/database';

const API_BASE = '/api';

function getHeaders(customCustomerId?: string | null): HeadersInit {
  const token = localStorage.getItem('talenttrack_token');
  const userId = localStorage.getItem('talenttrack_user_id');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (userId) headers['x-user-id'] = userId;
  if (customCustomerId) headers['x-customer-id'] = customCustomerId;
  return headers;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(err.error || 'Invalid credentials');
    }
    return res.json();
  },

  async getSession(): Promise<{ user: AuthUser }> {
    const res = await fetch(`${API_BASE}/auth/session`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Session invalid');
    return res.json();
  },

  async resetDemoData(): Promise<void> {
    await fetch(`${API_BASE}/auth/reset-demo`, {
      method: 'POST',
      headers: getHeaders(),
    });
  },

  // Admin
  async createCustomer(data: { name: string; contact_name: string; contact_email: string; password?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/create-customer`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create customer' }));
      throw new Error(err.error || 'Failed to create customer');
    }
    return res.json();
  },

  async createAdmin(data: { full_name: string; email: string; password?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/create-admin`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create admin' }));
      throw new Error(err.error || 'Failed to create admin');
    }
    return res.json();
  },

  async getAdminCustomers(): Promise<Customer[]> {
    const res = await fetch(`${API_BASE}/admin/customers`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch customers');
    return res.json();
  },

  // Dashboard Stats
  async getDashboardStats(customerId?: string | null): Promise<{ stats: DashboardStats; recent_candidates: Candidate[]; active_jobs: Job[] }> {
    const url = customerId ? `${API_BASE}/dashboard/stats?customerId=${customerId}` : `${API_BASE}/dashboard/stats`;
    const res = await fetch(url, {
      headers: getHeaders(customerId),
    });
    if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
    return res.json();
  },

  // Jobs
  async getJobs(customerId?: string | null): Promise<Job[]> {
    const url = customerId ? `${API_BASE}/jobs?customerId=${customerId}` : `${API_BASE}/jobs`;
    const res = await fetch(url, {
      headers: getHeaders(customerId),
    });
    if (!res.ok) throw new Error('Failed to fetch jobs');
    return res.json();
  },

  async getJob(id: string, customerId?: string | null): Promise<Job> {
    const res = await fetch(`${API_BASE}/jobs/${id}`, {
      headers: getHeaders(customerId),
    });
    if (!res.ok) throw new Error('Job not found');
    return res.json();
  },

  async createJob(job: Partial<Job>, customerId?: string | null): Promise<Job> {
    const res = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: getHeaders(customerId),
      body: JSON.stringify({ ...job, customer_id: customerId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create job' }));
      throw new Error(err.error || 'Failed to create job');
    }
    return res.json();
  },

  async updateJob(id: string, updates: Partial<Job>, customerId?: string | null): Promise<Job> {
    const res = await fetch(`${API_BASE}/jobs/${id}`, {
      method: 'PUT',
      headers: getHeaders(customerId),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update job' }));
      throw new Error(err.error || 'Failed to update job');
    }
    return res.json();
  },

  async deleteJob(id: string, customerId?: string | null): Promise<void> {
    const res = await fetch(`${API_BASE}/jobs/${id}`, {
      method: 'DELETE',
      headers: getHeaders(customerId),
    });
    if (!res.ok) throw new Error('Failed to delete job');
  },

  // Candidates
  async getCandidates(params?: { customerId?: string | null; jobId?: string; search?: string }): Promise<Candidate[]> {
    const query = new URLSearchParams();
    if (params?.customerId) query.set('customerId', params.customerId);
    if (params?.jobId && params.jobId !== 'all') query.set('jobId', params.jobId);
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`${API_BASE}/candidates?${query.toString()}`, {
      headers: getHeaders(params?.customerId),
    });
    if (!res.ok) throw new Error('Failed to fetch candidates');
    return res.json();
  },

  async getCandidate(id: string, customerId?: string | null): Promise<Candidate> {
    const res = await fetch(`${API_BASE}/candidates/${id}`, {
      headers: getHeaders(customerId),
    });
    if (!res.ok) throw new Error('Candidate not found');
    return res.json();
  },

  async createCandidate(candidate: Partial<Candidate>, customerId?: string | null): Promise<Candidate> {
    const res = await fetch(`${API_BASE}/candidates`, {
      method: 'POST',
      headers: getHeaders(customerId),
      body: JSON.stringify({ ...candidate, customer_id: customerId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to add candidate' }));
      throw new Error(err.error || 'Failed to add candidate');
    }
    return res.json();
  },

  async updateCandidate(id: string, updates: Partial<Candidate>, customerId?: string | null): Promise<Candidate> {
    const res = await fetch(`${API_BASE}/candidates/${id}`, {
      method: 'PUT',
      headers: getHeaders(customerId),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update candidate' }));
      throw new Error(err.error || 'Failed to update candidate');
    }
    return res.json();
  },

  async deleteCandidate(id: string, customerId?: string | null): Promise<void> {
    const res = await fetch(`${API_BASE}/candidates/${id}`, {
      method: 'DELETE',
      headers: getHeaders(customerId),
    });
    if (!res.ok) throw new Error('Failed to delete candidate');
  },

  // AI Assessment
  async runAIAssessment(candidateId: string, jobId: string, resumeText?: string): Promise<AIAssessment> {
    const res = await fetch(`${API_BASE}/ai/assess`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ candidate_id: candidateId, job_id: jobId, resume_text: resumeText }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'AI assessment service error' }));
      throw new Error(err.error || 'AI assessment failed');
    }
    const data = await res.json();
    return data.assessment;
  },

  async getLatestAssessment(candidateId: string): Promise<AIAssessment | null> {
    const res = await fetch(`${API_BASE}/ai/assessments/${candidateId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.assessment;
  },

  // Storage / CVs
  async uploadResume(candidateId: string, file: File): Promise<{ candidate: Candidate; filename: string }> {
    const formData = new FormData();
    formData.append('resume', file);

    const token = localStorage.getItem('talenttrack_token');
    const userId = localStorage.getItem('talenttrack_user_id');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (userId) headers['x-user-id'] = userId;

    const res = await fetch(`${API_BASE}/resumes/upload/${candidateId}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Failed to upload CV');
    }
    return res.json();
  },

  async getResumeDownloadUrl(candidateId: string): Promise<string> {
    const res = await fetch(`${API_BASE}/resumes/signed-url/${candidateId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Could not generate download link');
    const data = await res.json();
    return data.signedUrl;
  },

  // Public Application (no auth required)
  async getPublicJob(jobId: string): Promise<{
    id: string;
    title: string;
    description: string;
    location: string;
    employment_type: string;
    salary_range: string | null;
    status: string;
    created_at: string;
    company_name: string;
  }> {
    const res = await fetch(`${API_BASE}/public/jobs/${jobId}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Job not found' }));
      throw new Error(err.error || 'Job not found');
    }
    return res.json();
  },

  async submitPublicApplication(jobId: string, formData: FormData): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/public/apply/${jobId}`, {
      method: 'POST',
      body: formData, // multipart/form-data — no Content-Type header set manually
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Submission failed' }));
      throw new Error(err.error || 'Failed to submit application');
    }
    return res.json();
  },
};
