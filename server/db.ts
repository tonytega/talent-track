import fs from 'fs';
import path from 'path';

export interface Customer {
  id: string;
  name: string;
  contact_name: string;
  contact_email: string;
  created_at: string;
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
  role: 'admin' | 'customer';
  created_at: string;
}

export interface UserAuth {
  id: string;
  email: string;
  passwordHash: string;
  created_at: string;
}

export interface Job {
  id: string;
  customer_id: string;
  title: string;
  description: string;
  location: string;
  employment_type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  salary_range: string | null;
  status: 'Draft' | 'Open' | 'Closed';
  created_at: string;
  updated_at: string;
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
  stage: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected';
  notes: string | null;
  created_at: string;
  updated_at: string;
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

export interface DatabaseState {
  customers: Customer[];
  profiles: Profile[];
  user_roles: UserRole[];
  auth_users: UserAuth[];
  jobs: Job[];
  candidates: Candidate[];
  ai_assessments: AIAssessment[];
}

// const DB_FILE = path.resolve(process.cwd(), 'data', 'talenttrack_db.json');

// // Ensure data folder exists
// const dataDir = path.dirname(DB_FILE);
// if (!fs.existsSync(dataDir)) {
//   fs.mkdirSync(dataDir, { recursive: true });
// }

const DB_FILE = '/tmp/talenttrack_db.json';

const dataDir = path.dirname(DB_FILE);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function getInitialSeedData(): DatabaseState {
  const adminUserId = 'u0000000-0000-0000-0000-000000000001';
  const customerUserId = 'u0000000-0000-0000-0000-000000000002';
  const customerId = 'c1111111-1111-1111-1111-111111111111';

  return {
    customers: [
      {
        id: customerId,
        name: 'Acme Recruitment',
        contact_name: 'Sarah Jenkins',
        contact_email: 'recruiter@acme.com',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
    ],
    profiles: [
      {
        id: adminUserId,
        full_name: 'Alex Rivera (Admin)',
        email: 'admin@talenttrack.io',
        customer_id: null,
        created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
      },
      {
        id: customerUserId,
        full_name: 'Sarah Jenkins',
        email: 'recruiter@acme.com',
        customer_id: customerId,
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
    ],
    user_roles: [
      {
        id: 'r1111111-1111-1111-1111-111111111111',
        user_id: adminUserId,
        role: 'admin',
        created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
      },
      {
        id: 'r2222222-2222-2222-2222-222222222222',
        user_id: customerUserId,
        role: 'customer',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
    ],
    auth_users: [
      {
        id: adminUserId,
        email: 'admin@talenttrack.io',
        passwordHash: 'Password123!', // Demo simple hash verification
        created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
      },
      {
        id: customerUserId,
        email: 'recruiter@acme.com',
        passwordHash: 'Password123!',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
    ],
    jobs: [
      {
        id: 'j1111111-1111-1111-1111-111111111111',
        customer_id: customerId,
        title: 'Product Manager',
        description: 'We are seeking an experienced Product Manager to lead our B2B SaaS platform roadmap. You will work closely with engineering, UX research, and executive stakeholders to define product features, run discovery interviews, analyze user telemetry, and drive successful product launches.',
        location: 'Remote / London, UK',
        employment_type: 'Full-time',
        salary_range: '£75,000 - £90,000',
        status: 'Open',
        created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      },
      {
        id: 'j2222222-2222-2222-2222-222222222222',
        customer_id: customerId,
        title: 'Software Engineer',
        description: 'Looking for a passionate Full-Stack Software Engineer proficient in React, TypeScript, Node.js, and PostgreSQL. You will design scalable web microservices, build clean user interfaces, and collaborate in an agile environment with continuous delivery.',
        location: 'San Francisco, CA (Hybrid)',
        employment_type: 'Full-time',
        salary_range: '$140,000 - $175,000',
        status: 'Open',
        created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 18 * 86400000).toISOString(),
      },
      {
        id: 'j3333333-3333-3333-3333-333333333333',
        customer_id: customerId,
        title: 'Business Analyst',
        description: 'Contract Business Analyst to assess operational workflows, gather functional requirements, model data pipelines, and produce executive dashboards using SQL and modern BI tools.',
        location: 'New York, NY',
        employment_type: 'Contract',
        salary_range: '$65/hr - $80/hr',
        status: 'Closed',
        created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 45 * 86400000).toISOString(),
      },
    ],
    candidates: [
      {
        id: 'd1111111-1111-1111-1111-111111111111',
        customer_id: customerId,
        job_id: 'j1111111-1111-1111-1111-111111111111',
        first_name: 'Alexander',
        last_name: 'Wright',
        email: 'alex.wright@example.com',
        phone: '+44 7700 900123',
        linkedin_url: 'https://linkedin.com/in/alexander-wright-pm',
        portfolio_url: 'https://alexwright.design',
        location: 'London, UK',
        resume_path: 'resumes/alexander_wright_cv.pdf',
        stage: 'Applied',
        notes: 'Applied via website referral. Has 4 years of SaaS PM background.',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'd2222222-2222-2222-2222-222222222222',
        customer_id: customerId,
        job_id: 'j2222222-2222-2222-2222-222222222222',
        first_name: 'Sophia',
        last_name: 'Chen',
        email: 'sophia.chen@example.com',
        phone: '+1 (415) 555-0182',
        linkedin_url: 'https://linkedin.com/in/sophiachen-dev',
        portfolio_url: 'https://github.com/sophiachen-code',
        location: 'San Francisco, CA',
        resume_path: 'resumes/sophia_chen_cv.pdf',
        stage: 'Applied',
        notes: 'Recent graduate with solid React/TypeScript internship experience.',
        created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: 'd3333333-3333-3333-3333-333333333333',
        customer_id: customerId,
        job_id: 'j2222222-2222-2222-2222-222222222222',
        first_name: 'Marcus',
        last_name: 'Vance',
        email: 'marcus.vance@example.com',
        phone: '+1 (510) 555-0144',
        linkedin_url: 'https://linkedin.com/in/marcus-vance-eng',
        portfolio_url: 'https://marcusvance.io',
        location: 'Oakland, CA',
        resume_path: 'resumes/marcus_vance_cv.pdf',
        stage: 'Screening',
        notes: 'Recruiter phone screen scheduled for Thursday. Strong backend SQL and system design skillset.',
        created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 6 * 86400000).toISOString(),
      },
      {
        id: 'd4444444-4444-4444-4444-444444444444',
        customer_id: customerId,
        job_id: 'j1111111-1111-1111-1111-111111111111',
        first_name: 'Elena',
        last_name: 'Rostova',
        email: 'elena.rostova@example.com',
        phone: '+44 7911 123456',
        linkedin_url: 'https://linkedin.com/in/elena-rostova-pm',
        portfolio_url: null,
        location: 'Manchester, UK',
        resume_path: 'resumes/elena_rostova_cv.pdf',
        stage: 'Screening',
        notes: 'Strong Agile/Scrum background in FinTech. Initial screening call completed positively.',
        created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 8 * 86400000).toISOString(),
      },
      {
        id: 'd5555555-5555-5555-5555-555555555555',
        customer_id: customerId,
        job_id: 'j1111111-1111-1111-1111-111111111111',
        first_name: 'David',
        last_name: 'Kim',
        email: 'david.kim@example.com',
        phone: '+1 (206) 555-0199',
        linkedin_url: 'https://linkedin.com/in/david-kim-product',
        portfolio_url: 'https://davidkim.pm',
        location: 'Seattle, WA (Remote)',
        resume_path: 'resumes/david_kim_cv.pdf',
        stage: 'Interview',
        notes: 'Completed hiring manager round. Moving to final panel presentation with Engineering Lead.',
        created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 12 * 86400000).toISOString(),
      },
      {
        id: 'd6666666-6666-6666-6666-666666666666',
        customer_id: customerId,
        job_id: 'j2222222-2222-2222-2222-222222222222',
        first_name: 'Olivia',
        last_name: 'Taylor',
        email: 'olivia.taylor@example.com',
        phone: '+1 (408) 555-0131',
        linkedin_url: 'https://linkedin.com/in/oliviataylor-dev',
        portfolio_url: 'https://github.com/oliviataylor',
        location: 'San Jose, CA',
        resume_path: 'resumes/olivia_taylor_cv.pdf',
        stage: 'Interview',
        notes: 'Passed technical coding test with 95% score. On-site architecture interview next week.',
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
      {
        id: 'd7777777-7777-7777-7777-777777777777',
        customer_id: customerId,
        job_id: 'j2222222-2222-2222-2222-222222222222',
        first_name: 'Liam',
        last_name: "O'Connor",
        email: 'liam.oconnor@example.com',
        phone: '+1 (650) 555-0177',
        linkedin_url: 'https://linkedin.com/in/liam-oconnor-swe',
        portfolio_url: 'https://liam.dev',
        location: 'San Francisco, CA',
        resume_path: 'resumes/liam_oconnor_cv.pdf',
        stage: 'Offer',
        notes: 'Formal offer package sent ($165k base + equity). Awaiting signature by end of week.',
        created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      },
      {
        id: 'd8888888-8888-8888-8888-888888888888',
        customer_id: customerId,
        job_id: 'j1111111-1111-1111-1111-111111111111',
        first_name: 'Priya',
        last_name: 'Patel',
        email: 'priya.patel@example.com',
        phone: '+44 7822 987654',
        linkedin_url: 'https://linkedin.com/in/priyapatel-leads',
        portfolio_url: null,
        location: 'London, UK',
        resume_path: 'resumes/priya_patel_cv.pdf',
        stage: 'Offer',
        notes: 'Verbal offer accepted (£85,000). Preparing contract documents.',
        created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      },
      {
        id: 'd9999999-9999-9999-9999-999999999999',
        customer_id: customerId,
        job_id: 'j3333333-3333-3333-3333-333333333333',
        first_name: 'Lucas',
        last_name: 'Mendoza',
        email: 'lucas.mendoza@example.com',
        phone: '+1 (212) 555-0165',
        linkedin_url: 'https://linkedin.com/in/lucasmendoza-ba',
        portfolio_url: null,
        location: 'New York, NY',
        resume_path: 'resumes/lucas_mendoza_cv.pdf',
        stage: 'Hired',
        notes: 'Successfully onboarded as Business Analyst for Q3 finance migration.',
        created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 25 * 86400000).toISOString(),
      },
      {
        id: 'daaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        customer_id: customerId,
        job_id: 'j2222222-2222-2222-2222-222222222222',
        first_name: 'Ethan',
        last_name: 'Brooke',
        email: 'ethan.brooke@example.com',
        phone: '+1 (415) 555-0112',
        linkedin_url: 'https://linkedin.com/in/ethanbrooke',
        portfolio_url: null,
        location: 'Austin, TX',
        resume_path: 'resumes/ethan_brooke_cv.pdf',
        stage: 'Rejected',
        notes: 'Candidate lacked required hands-on PostgreSQL and distributed caching depth. Polite rejection letter sent.',
        created_at: new Date(Date.now() - 16 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 16 * 86400000).toISOString(),
      },
    ],
    ai_assessments: [
      {
        id: 'a1111111-1111-1111-1111-111111111111',
        candidate_id: 'd5555555-5555-5555-5555-555555555555',
        job_id: 'j1111111-1111-1111-1111-111111111111',
        score: 88,
        summary: 'David displays exceptional alignment with the Product Manager role, showcasing over 5 years of SaaS roadmap ownership, cross-functional agile leadership, and metric-driven discovery cycles.',
        strengths: [
          '5+ years leading B2B SaaS roadmap and sprint planning',
          'Demonstrated experience in user telemetry, Amplitude, and SQL data queries',
          'Strong track record of cross-functional alignment between Engineering and Design',
          'Certified Scrum Product Owner (CSPO)'
        ],
        gaps: [
          'Candidate has primarily worked in North American timezones (role requires UK/London collaboration)',
          'Limited direct experience with enterprise SOC2 compliance workflows'
        ],
        created_at: new Date(Date.now() - 11 * 86400000).toISOString(),
      },
    ],
  };
}

class Database {
  private state: DatabaseState;

  constructor() {
    this.state = this.load();
  }

  private load(): DatabaseState {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.warn('Could not read db file, loading default seed data:', err);
      }
    }
    const seed = getInitialSeedData();
    this.saveDirect(seed);
    return seed;
  }

  private saveDirect(state: DatabaseState) {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  }

  private save() {
    this.saveDirect(this.state);
  }

  // --- Auth & Users ---
  findUserByEmail(email: string): UserAuth | undefined {
    return this.state.auth_users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id: string): UserAuth | undefined {
    return this.state.auth_users.find(u => u.id === id);
  }

  createAuthUser(email: string, passwordHash: string): UserAuth {
    const user: UserAuth = {
      id: 'u' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36),
      email,
      passwordHash,
      created_at: new Date().toISOString(),
    };
    this.state.auth_users.push(user);
    this.save();
    return user;
  }

  // --- Profiles ---
  getProfile(userId: string): Profile | undefined {
    return this.state.profiles.find(p => p.id === userId);
  }

  createProfile(profile: Profile): Profile {
    this.state.profiles.push(profile);
    this.save();
    return profile;
  }

  updateProfile(userId: string, updates: Partial<Profile>): Profile | undefined {
    const profile = this.getProfile(userId);
    if (!profile) return undefined;
    Object.assign(profile, updates);
    this.save();
    return profile;
  }

  // --- User Roles ---
  getUserRole(userId: string): UserRole | undefined {
    return this.state.user_roles.find(r => r.user_id === userId);
  }

  createUserRole(role: UserRole): UserRole {
    this.state.user_roles.push(role);
    this.save();
    return role;
  }

  // --- Customers ---
  getCustomers(): Customer[] {
    return this.state.customers;
  }

  getCustomer(id: string): Customer | undefined {
    return this.state.customers.find(c => c.id === id);
  }

  createCustomer(customer: Customer): Customer {
    this.state.customers.push(customer);
    this.save();
    return customer;
  }

  // --- Jobs ---
  getJobs(customerId?: string): Job[] {
    if (!customerId) return this.state.jobs;
    return this.state.jobs.filter(j => j.customer_id === customerId);
  }

  getJob(id: string): Job | undefined {
    return this.state.jobs.find(j => j.id === id);
  }

  createJob(job: Job): Job {
    this.state.jobs.push(job);
    this.save();
    return job;
  }

  updateJob(id: string, updates: Partial<Job>): Job | undefined {
    const job = this.getJob(id);
    if (!job) return undefined;
    Object.assign(job, updates, { updated_at: new Date().toISOString() });
    this.save();
    return job;
  }

  deleteJob(id: string): boolean {
    const index = this.state.jobs.findIndex(j => j.id === id);
    if (index === -1) return false;
    this.state.jobs.splice(index, 1);
    // Cascade delete candidates and assessments
    const candIds = this.state.candidates.filter(c => c.job_id === id).map(c => c.id);
    this.state.candidates = this.state.candidates.filter(c => c.job_id !== id);
    this.state.ai_assessments = this.state.ai_assessments.filter(a => a.job_id !== id && !candIds.includes(a.candidate_id));
    this.save();
    return true;
  }

  // --- Candidates ---
  getCandidates(customerId?: string, jobId?: string): Candidate[] {
    let list = this.state.candidates;
    if (customerId) {
      list = list.filter(c => c.customer_id === customerId);
    }
    if (jobId) {
      list = list.filter(c => c.job_id === jobId);
    }
    return list;
  }

  getCandidate(id: string): Candidate | undefined {
    return this.state.candidates.find(c => c.id === id);
  }

  createCandidate(candidate: Candidate): Candidate {
    this.state.candidates.push(candidate);
    this.save();
    return candidate;
  }

  updateCandidate(id: string, updates: Partial<Candidate>): Candidate | undefined {
    const cand = this.getCandidate(id);
    if (!cand) return undefined;
    Object.assign(cand, updates, { updated_at: new Date().toISOString() });
    this.save();
    return cand;
  }

  deleteCandidate(id: string): boolean {
    const index = this.state.candidates.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.state.candidates.splice(index, 1);
    this.state.ai_assessments = this.state.ai_assessments.filter(a => a.candidate_id !== id);
    this.save();
    return true;
  }

  // --- AI Assessments ---
  getAssessments(candidateId?: string): AIAssessment[] {
    if (!candidateId) return this.state.ai_assessments;
    return this.state.ai_assessments.filter(a => a.candidate_id === candidateId);
  }

  getLatestAssessment(candidateId: string): AIAssessment | undefined {
    const list = this.getAssessments(candidateId);
    if (list.length === 0) return undefined;
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  }

  createAssessment(assessment: AIAssessment): AIAssessment {
    this.state.ai_assessments.push(assessment);
    this.save();
    return assessment;
  }

  // --- Reset/Seed ---
  resetToSeed() {
    this.state = getInitialSeedData();
    this.save();
  }
}

export const db = new Database();
