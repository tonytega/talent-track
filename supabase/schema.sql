-- TalentTrack Mini ATS Database Schema
-- Supabase PostgreSQL with Row Level Security (RLS)

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. USER ROLES TABLE
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'customer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_role UNIQUE (user_id, role)
);

-- 5. JOBS TABLE
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    employment_type TEXT NOT NULL CHECK (employment_type IN ('Full-time', 'Part-time', 'Contract', 'Internship')),
    salary_range TEXT,
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Draft', 'Open', 'Closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. CANDIDATES TABLE
CREATE TABLE IF NOT EXISTS public.candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    linkedin_url TEXT,
    portfolio_url TEXT,
    location TEXT,
    resume_path TEXT,
    stage TEXT NOT NULL DEFAULT 'Applied' CHECK (stage IN ('Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. AI ASSESSMENTS TABLE
CREATE TABLE IF NOT EXISTS public.ai_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    summary TEXT NOT NULL,
    strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
    gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_customer_id ON public.profiles(customer_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON public.jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_candidates_customer_id ON public.candidates(customer_id);
CREATE INDEX IF NOT EXISTS idx_candidates_job_id ON public.candidates(job_id);
CREATE INDEX IF NOT EXISTS idx_candidates_stage ON public.candidates(stage);
CREATE INDEX IF NOT EXISTS idx_candidates_search ON public.candidates(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_ai_assessments_candidate_id ON public.ai_assessments(candidate_id);

-- 9. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_jobs_updated_at ON public.jobs;
CREATE TRIGGER tr_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_candidates_updated_at ON public.candidates;
CREATE TRIGGER tr_candidates_updated_at
    BEFORE UPDATE ON public.candidates
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 10. SECURITY HELPER FUNCTIONS (RLS)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_customer_id(user_id UUID)
RETURNS UUID AS $$
DECLARE
    cid UUID;
BEGIN
    SELECT customer_id INTO cid FROM public.profiles WHERE id = user_id;
    RETURN cid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_assessments ENABLE ROW LEVEL SECURITY;

-- 12. RLS POLICIES

-- CUSTOMERS: Admins can do everything; Customers can view their own company
DROP POLICY IF EXISTS "Admin customer access" ON public.customers;
CREATE POLICY "Admin customer access" ON public.customers
    FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Customer view own profile" ON public.customers;
CREATE POLICY "Customer view own profile" ON public.customers
    FOR SELECT TO authenticated
    USING (id = public.get_user_customer_id(auth.uid()));

-- PROFILES: Admin can do all; User can view & update own profile
DROP POLICY IF EXISTS "Admin profile access" ON public.profiles;
CREATE POLICY "Admin profile access" ON public.profiles
    FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid() OR customer_id = public.get_user_customer_id(auth.uid()));

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- USER ROLES: Users can view own role; Admin can view/manage
DROP POLICY IF EXISTS "Admin role access" ON public.user_roles;
CREATE POLICY "Admin role access" ON public.user_roles
    FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users view own role" ON public.user_roles;
CREATE POLICY "Users view own role" ON public.user_roles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- JOBS: Admin full access; Customers can view & manage their workspace jobs
DROP POLICY IF EXISTS "Admin jobs access" ON public.jobs;
CREATE POLICY "Admin jobs access" ON public.jobs
    FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Customer workspace jobs access" ON public.jobs;
CREATE POLICY "Customer workspace jobs access" ON public.jobs
    FOR ALL TO authenticated
    USING (customer_id = public.get_user_customer_id(auth.uid()))
    WITH CHECK (customer_id = public.get_user_customer_id(auth.uid()));

-- CANDIDATES: Admin full access; Customers can view & manage their workspace candidates
DROP POLICY IF EXISTS "Admin candidates access" ON public.candidates;
CREATE POLICY "Admin candidates access" ON public.candidates
    FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Customer workspace candidates access" ON public.candidates;
CREATE POLICY "Customer workspace candidates access" ON public.candidates
    FOR ALL TO authenticated
    USING (customer_id = public.get_user_customer_id(auth.uid()))
    WITH CHECK (customer_id = public.get_user_customer_id(auth.uid()));

-- AI ASSESSMENTS: Admin full access; Customers access assessments for their candidates
DROP POLICY IF EXISTS "Admin assessments access" ON public.ai_assessments;
CREATE POLICY "Admin assessments access" ON public.ai_assessments
    FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Customer workspace assessments access" ON public.ai_assessments;
CREATE POLICY "Customer workspace assessments access" ON public.ai_assessments
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.candidates c
            WHERE c.id = ai_assessments.candidate_id
            AND c.customer_id = public.get_user_customer_id(auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.candidates c
            WHERE c.id = ai_assessments.candidate_id
            AND c.customer_id = public.get_user_customer_id(auth.uid())
        )
    );

-- 13. STORAGE BUCKET (Private 'resumes')
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "Authenticated users can upload resumes" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Workspace users can view resumes" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'resumes');
