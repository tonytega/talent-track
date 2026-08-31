export type UserRoleType = 'admin' | 'customer';

export type JobStatus = 'Draft' | 'Open' | 'Closed';

export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship';

export type CandidateStage = 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected';

export interface Customer {
  id: string;
  name: string;
  contact_name: string;
  contact_email: string;
  created_at: string;
  jobs_count?: number;
  active_jobs_count?: number;
  candidates_count?: number;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  customer_id: string | null;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: UserRoleType;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  customer_id: string | null;
  role: UserRoleType;
  customer?: Customer | null;
}

export interface Job {
  id: string;
  customer_id: string;
  title: string;
  description: string;
  location: string;
  employment_type: EmploymentType;
  salary_range: string | null;
  status: JobStatus;
  created_at: string;
  updated_at: string;
  candidate_count?: number;
}

export interface Candidate {
  id: string;
  customer_id: string;
  job_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  location: string | null;
  resume_path: string | null;
  stage: CandidateStage;
  notes: string | null;
  created_at: string;
  updated_at: string;
  job_title?: string;
  latest_assessment?: AIAssessment | null;
}

export interface AIAssessment {
  id: string;
  candidate_id: string;
  job_id: string;
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  created_at: string;
}

export interface DashboardStats {
  active_jobs: number;
  total_candidates: number;
  in_interview: number;
  hired: number;
}
