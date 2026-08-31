# TalentTrack — Mini ATS (Applicant Tracking System)

TalentTrack is a modern, lightweight, and deployable Applicant Tracking System (ATS) designed for recruiters and hiring managers. It streamlines candidate management through a reliable, focused end-to-end workflow:

```
LOGIN → CREATE JOB → ADD CANDIDATES → KANBAN → MOVE CANDIDATES → SEARCH / FILTER → CANDIDATE PROFILE → CV UPLOAD → AI ASSESSMENT
```

---

## 🚀 Key Features

* **Two-Tier Authentication & Roles**:
  * **Admin**: Manage customer workspaces, provision recruiter/admin accounts, view cross-workspace metrics, and switch into individual customer workspaces with high-visibility banner context.
  * **Customer (Recruiter)**: Full candidate pipeline control within their isolated company workspace (PostgreSQL Row Level Security).
* **Job Management**:
  * Create, edit, and close job openings with compensation, employment type, location, and description.
  * Closed jobs remain accessible to review historical candidates.
* **Interactive 6-Stage Candidate Kanban Board**:
  * Stages: `Applied`, `Screening`, `Interview`, `Offer`, `Hired`, `Rejected`.
  * HTML5 Drag-and-Drop + accessible action dropdown menu.
  * Real-time text search (First name, Last name, Full name, Email) combined with dynamic Job filtering.
* **Candidate Profile Drawer**:
  * Full contact details (Phone, Email, Location, LinkedIn, Portfolio).
  * Persistent editable recruiter notes.
  * Private Resume/CV document management with secure upload, replace, and signed download links (PDF & DOCX, max 5MB).
* **Server-Side AI CV Assessment**:
  * Compares Candidate CV & background against Job requirements using Google Gemini Flash.
  * Generates Match Score (0–100), Executive Summary, Key Strengths, and Potential Gaps for interviewers.
  * Strict ethical safeguards: decision support only; never leaks AI API keys or service role keys to the browser.
* **Autonomous Database Management**:
  * Built-in zero-config database engine for instant local execution.
  * Automated migration and seeding scripts (`npm run db:setup`, `npm run db:seed`) to provision live Supabase PostgreSQL instances with zero manual SQL console work.

---

## 🛠️ Tech Stack

* **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router v6.
* **Backend Server**: Node.js, Express, Multer (secure file upload), Google Gemini API (`@google/genai`).
* **Database & Storage**: PostgreSQL / Supabase, Row Level Security (RLS) policies, Private Storage bucket for resumes.

---

## 👥 Demo Accounts

TalentTrack comes pre-loaded with realistic seed data for **Acme Recruitment** (3 jobs and 10 candidates across all 6 stages):

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@talenttrack.io` | `Password123!` | Global administration + all customer workspaces |
| **Recruiter** | `recruiter@acme.com` | `Password123!` | Acme Recruitment workspace |

*(1-click quick-fill buttons are provided on the `/login` screen for rapid testing.)*

---

## 📦 Quick Start (Local Setup)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

```env
# Frontend Supabase (Public)
VITE_SUPABASE_URL=http://localhost:3001/supabase-mock
VITE_SUPABASE_ANON_KEY=mock-anon-key-talenttrack-mvp

# Server (Private / Server-Only)
PORT=3001
SUPABASE_URL=http://localhost:3001/supabase-mock
SUPABASE_SERVICE_ROLE_KEY=mock-service-role-key-talenttrack-mvp

# Google Gemini AI Key (Optional - Falls back to high-fidelity built-in ATS heuristics if omitted)
GEMINI_API_KEY=
```

### 3. Run Automated Database Provisioning & Seed
```bash
npm run db:setup
```

### 4. Start Development Server
```bash
npm run dev
```
Open **http://localhost:5173** in your browser.

---

## 🗄️ Connecting Live Supabase Cloud Database

When you want to deploy against a live Supabase PostgreSQL instance:

1. Create a project at [supabase.com](https://supabase.com).
2. Add your project credentials to `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
3. Run the schema migration in Supabase SQL Editor or execute:
   ```bash
   npm run db:setup
   ```
   This executes `supabase/schema.sql` and `supabase/seed.sql` to configure tables, indexes, RLS policies, and the `resumes` storage bucket.

---

## 🔒 Security Model & Row Level Security (RLS)

* **Workspace Isolation**: Customer A cannot access Customer B's records via URL tampering, API tampering, or query modification.
* **Privileged Actions**: Admin creation and AI CV evaluations run strictly server-side through Express endpoints (`/api/admin/*`, `/api/ai/*`).
* **Resume Confidentiality**: Resumes are stored in a private bucket accessible only via short-lived signed URLs.

---

## 🧪 MVP Verification Checklist

- [x] Admin can log in (`admin@talenttrack.io`)
- [x] Customer can log in (`recruiter@acme.com`)
- [x] Admin can create customer accounts with automated credential provisioning
- [x] Customer can create and edit job openings
- [x] Customer can add candidates to jobs (default stage `Applied`)
- [x] Candidates appear in Kanban column `Applied`
- [x] Candidates can be moved across all 6 stages via drag-and-drop or menu
- [x] Stage transitions persist in the database across page refreshes
- [x] Candidates can be searched by first, last, or full name
- [x] Candidates can be filtered by Job
- [x] Combined search and job filtering operate in real time
- [x] Candidate profile drawer displays personal info, notes, and links
- [x] CV files (PDF/DOCX) can be uploaded, replaced, and downloaded securely
- [x] AI CV Assessment triggers against job description and displays Match Score (0–100), Summary, Strengths, and Gaps
- [x] Admin can switch into `/admin/customers/:customerId` with clear workspace banner
- [x] Admin can manage customer jobs, candidates, and AI assessments inside customer workspace
- [x] Customer workspace data is strictly isolated via RLS
- [x] Unauthenticated users are redirected to `/login`
- [x] Privileged secrets are never bundled in client code
- [x] Production build passes clean TypeScript typecheck
