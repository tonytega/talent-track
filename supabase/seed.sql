-- TalentTrack Seed Data: Acme Recruitment Demo Environment

-- 1. Demo Customer
INSERT INTO public.customers (id, name, contact_name, contact_email, created_at)
VALUES 
    ('c1111111-1111-1111-1111-111111111111', 'Acme Recruitment', 'Sarah Jenkins', 'recruiter@acme.com', now() - interval '30 days')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. Demo Jobs
INSERT INTO public.jobs (id, customer_id, title, description, location, employment_type, salary_range, status, created_at)
VALUES
    (
            '11111111-1111-1111-1111-111111111111',
        'c1111111-1111-1111-1111-111111111111',
        'Product Manager',
        'We are seeking an experienced Product Manager to lead our B2B SaaS platform roadmap. You will work closely with engineering, UX research, and executive stakeholders to define product features, run discovery interviews, analyze user telemetry, and drive successful product launches.',
        'Remote / London, UK',
        'Full-time',
        '£75,000 - £90,000',
        'Open',
        now() - interval '20 days'
    ),
    (
            '22222222-2222-2222-2222-222222222222',
        'c1111111-1111-1111-1111-111111111111',
        'Software Engineer',
        'Looking for a passionate Full-Stack Software Engineer proficient in React, TypeScript, Node.js, and PostgreSQL. You will design scalable web microservices, build clean user interfaces, and collaborate in an agile environment with continuous delivery.',
        'San Francisco, CA (Hybrid)',
        'Full-time',
        '$140,000 - $175,000',
        'Open',
        now() - interval '18 days'
    ),
    (
            '33333333-3333-3333-3333-333333333333',
        'c1111111-1111-1111-1111-111111111111',
        'Business Analyst',
        'Contract Business Analyst to assess operational workflows, gather functional requirements, model data pipelines, and produce executive dashboards using SQL and modern BI tools.',
        'New York, NY',
        'Contract',
        '$65/hr - $80/hr',
        'Closed',
        now() - interval '45 days'
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.candidates (id, customer_id, job_id, first_name, last_name, email, phone, linkedin_url, portfolio_url, location, stage, notes, created_at)
VALUES
    -- Applied (2)
    (
        'd1111111-1111-1111-1111-111111111111',
        'c1111111-1111-1111-1111-111111111111',
            '11111111-1111-1111-1111-111111111111',
        'Alexander',
        'Wright',
        'alex.wright@example.com',
        '+44 7700 900123',
        'https://linkedin.com/in/alexander-wright-pm',
        'https://alexwright.design',
        'London, UK',
        'Applied',
        'Applied via website referral. Has 4 years of SaaS PM background.',
        now() - interval '2 days'
    ),
    (
        'd2222222-2222-2222-2222-222222222222',
        'c1111111-1111-1111-1111-111111111111',
            '22222222-2222-2222-2222-222222222222',
        'Sophia',
        'Chen',
        'sophia.chen@example.com',
        '+1 (415) 555-0182',
        'https://linkedin.com/in/sophiachen-dev',
        'https://github.com/sophiachen-code',
        'San Francisco, CA',
        'Applied',
        'Recent graduate with solid React/TypeScript internship experience.',
        now() - interval '3 days'
    ),

    -- Screening (2)
    (
        'd3333333-3333-3333-3333-333333333333',
        'c1111111-1111-1111-1111-111111111111',
            '22222222-2222-2222-2222-222222222222',
        'Marcus',
        'Vance',
        'marcus.vance@example.com',
        '+1 (510) 555-0144',
        'https://linkedin.com/in/marcus-vance-eng',
        'https://marcusvance.io',
        'Oakland, CA',
        'Screening',
        'Recruiter phone screen scheduled for Thursday. Strong backend SQL and system design skillset.',
        now() - interval '6 days'
    ),
    (
        'd4444444-4444-4444-4444-444444444444',
        'c1111111-1111-1111-1111-111111111111',
            '11111111-1111-1111-1111-111111111111',
        'Elena',
        'Rostova',
        'elena.rostova@example.com',
        '+44 7911 123456',
        'https://linkedin.com/in/elena-rostova-pm',
        NULL,
        'Manchester, UK',
        'Screening',
        'Strong Agile/Scrum background in FinTech. Initial screening call completed positively.',
        now() - interval '8 days'
    ),

    -- Interview (2)
    (
        'd5555555-5555-5555-5555-555555555555',
        'c1111111-1111-1111-1111-111111111111',
            '11111111-1111-1111-1111-111111111111',
        'David',
        'Kim',
        'david.kim@example.com',
        '+1 (206) 555-0199',
        'https://linkedin.com/in/david-kim-product',
        'https://davidkim.pm',
        'Seattle, WA (Remote)',
        'Interview',
        'Completed hiring manager round. Moving to final panel presentation with Engineering Lead.',
        now() - interval '12 days'
    ),
    (
        'd6666666-6666-6666-6666-666666666666',
        'c1111111-1111-1111-1111-111111111111',
            '22222222-2222-2222-2222-222222222222',
        'Olivia',
        'Taylor',
        'olivia.taylor@example.com',
        '+1 (408) 555-0131',
        'https://linkedin.com/in/oliviataylor-dev',
        'https://github.com/oliviataylor',
        'San Jose, CA',
        'Interview',
        'Passed technical coding test with 95% score. On-site architecture interview next week.',
        now() - interval '10 days'
    ),

    -- Offer (2)
    (
        'd7777777-7777-7777-7777-777777777777',
        'c1111111-1111-1111-1111-111111111111',
            '22222222-2222-2222-2222-222222222222',
        'Liam',
        'O''Connor',
        'liam.oconnor@example.com',
        '+1 (650) 555-0177',
        'https://linkedin.com/in/liam-oconnor-swe',
        'https://liam.dev',
        'San Francisco, CA',
        'Offer',
        'Formal offer package sent ($165k base + equity). Awaiting signature by end of week.',
        now() - interval '14 days'
    ),
    (
        'd8888888-8888-8888-8888-888888888888',
        'c1111111-1111-1111-1111-111111111111',
            '11111111-1111-1111-1111-111111111111',
        'Priya',
        'Patel',
        'priya.patel@example.com',
        '+44 7822 987654',
        'https://linkedin.com/in/priyapatel-leads',
        NULL,
        'London, UK',
        'Offer',
        'Verbal offer accepted (£85,000). Preparing contract documents.',
        now() - interval '15 days'
    ),

    -- Hired (1)
    (
        'd9999999-9999-9999-9999-999999999999',
        'c1111111-1111-1111-1111-111111111111',
            '33333333-3333-3333-3333-333333333333',
        'Lucas',
        'Mendoza',
        'lucas.mendoza@example.com',
        '+1 (212) 555-0165',
        'https://linkedin.com/in/lucasmendoza-ba',
        NULL,
        'New York, NY',
        'Hired',
        'Successfully onboarded as Business Analyst for Q3 finance migration.',
        now() - interval '25 days'
    ),

    -- Rejected (1)
    (
        'daaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'c1111111-1111-1111-1111-111111111111',
            '22222222-2222-2222-2222-222222222222',
        'Ethan',
        'Brooke',
        'ethan.brooke@example.com',
        '+1 (415) 555-0112',
        'https://linkedin.com/in/ethanbrooke',
        NULL,
        'Austin, TX',
        'Rejected',
        'Candidate lacked required hands-on PostgreSQL and distributed caching depth. Polite rejection letter sent.',
        now() - interval '16 days'
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.ai_assessments (id, candidate_id, job_id, score, summary, strengths, gaps, created_at)
VALUES
    (
        'a1111111-1111-1111-1111-111111111111',
        'd5555555-5555-5555-5555-555555555555',
            '11111111-1111-1111-1111-111111111111',
        88,
        'David displays exceptional alignment with the Product Manager role, showcasing over 5 years of SaaS roadmap ownership, cross-functional agile leadership, and metric-driven discovery cycles.',
        '["5+ years leading B2B SaaS roadmap and sprint planning", "Demonstrated experience in user telemetry, Amplitude, and SQL data queries", "Strong track record of cross-functional alignment between Engineering and Design", "Certified Scrum Product Owner (CSPO)"]'::jsonb,
        '["Candidate has primarily worked in North American timezones (role requires UK/London collaboration)", "Limited direct experience with enterprise SOC2 compliance workflows"]'::jsonb,
        now() - interval '11 days'
    )
ON CONFLICT (id) DO NOTHING;
