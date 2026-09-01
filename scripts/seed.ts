import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { db } from '../server/db';
import { isSupabaseEnabled, getServiceRoleClient } from '../server/supabaseClient';

dotenv.config();

async function findUserIdByEmail(email: string) {
	const url = `${process.env.SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`;
	const res = await fetch(url, {
		headers: {
			Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
			apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
		}
	});
	if (!res.ok) return null;
	const data = await res.json();
	// Supabase admin REST returns { users: [...] }
	if (data && Array.isArray((data as any).users) && (data as any).users.length > 0) {
		const users = (data as any).users as any[];
		const match = users.find(u => u.email === email) || users[0];
		return match?.id || null;
	}
	if (Array.isArray(data) && data.length > 0) return data[0].id;
	if (data && (data as any).id) return (data as any).id;
	return null;
}

async function seedSupabase() {
	const svc = getServiceRoleClient();
	const dataPath = path.resolve(process.cwd(), 'data', 'talenttrack_db.json');
	if (!fs.existsSync(dataPath)) throw new Error('Seed data file not found: ' + dataPath);
	const raw = fs.readFileSync(dataPath, 'utf-8');
	const state = JSON.parse(raw);

	console.log('Seeding Supabase with demo data...');

	// Pre-populate existing auth users by email to make seeding idempotent
	for (const u of state.auth_users) {
		try {
			const existing = await findUserIdByEmail(u.email);
			if (existing) {
				authMap[u.id] = existing;
				emailMap[u.email] = existing;
				console.log('Pre-mapped existing auth user', u.email);
			}
		} catch (e) {
			// ignore lookup errors and fall back to create
		}
	
	}

	const authMap: Record<string, string> = {};
	const emailMap: Record<string, string> = {};
	const customerMap: Record<string, string> = {};
	const jobMap: Record<string, string> = {};
	const candidateMap: Record<string, string> = {};

	// 1. Create auth users
	for (const u of state.auth_users) {
		const pass = String(u.passwordHash || 'Password123!');
		try {
			const { data: userData, error: userError } = await svc.auth.admin.createUser({ email: u.email, password: pass });
			if (userError) throw userError;
			authMap[u.id] = userData.id;
			emailMap[u.email] = userData.id;
			console.log('Created auth user', u.email);
		} catch (err: any) {
			const msg = String(err?.message || err || '');
			if (msg.includes('already') || msg.includes('registered')) {
				// Try to find an existing profile record with this email first
				try {
					const { data: existingProfile } = await svc.from('profiles').select('id').eq('email', u.email).maybeSingle();
					if (existingProfile && existingProfile.id) {
						authMap[u.id] = existingProfile.id;
						emailMap[u.email] = existingProfile.id;
						console.log('Found existing profile id for', u.email);
						continue;
					}
				} catch (e) {
					// ignore and fallback to admin REST lookup
				}
				const existingId = await findUserIdByEmail(u.email);
				if (existingId) {
					authMap[u.id] = existingId;
					emailMap[u.email] = existingId;
					console.log('Auth user already exists, mapped id for', u.email);
					continue;
				}
			}
			throw err;
		}
	}

	// 2. Create customers
	for (const c of state.customers) {
		const payload = { name: c.name, contact_name: c.contact_name, contact_email: c.contact_email, created_at: c.created_at };
		const { data, error } = await svc.from('customers').insert(payload).select().maybeSingle();
		if (error) throw error;
		customerMap[c.id] = data.id;
		console.log('Created customer', c.name);
	}

	// 3. Create profiles
	for (const p of state.profiles) {
		const mappedUserId = authMap[p.id] || emailMap[p.email];
		const mappedCustomerId = p.customer_id ? customerMap[p.customer_id] : null;
		const payload: any = { full_name: p.full_name, email: p.email, customer_id: mappedCustomerId, created_at: p.created_at };
		if (mappedUserId) payload.id = mappedUserId;
		const { data, error } = await svc.from('profiles').insert(payload).select().maybeSingle();
		if (error) throw error;
		console.log('Created profile', p.email, mappedUserId ? `(id mapped)` : `(id generated)`);
	}

	// 4. Create user_roles
	for (const r of state.user_roles) {
		const mappedUserId = authMap[r.user_id] || emailMap[r.user_id] || r.user_id;
		const payload: any = { user_id: mappedUserId, role: r.role, created_at: r.created_at };
		const { data, error } = await svc.from('user_roles').insert(payload).select().maybeSingle();
		if (error) throw error;
		console.log('Created role for', mappedUserId, r.role);
	}

	// 5. Jobs
	for (const j of state.jobs) {
		const mappedCustomerId = customerMap[j.customer_id];
		const payload: any = { customer_id: mappedCustomerId, title: j.title, description: j.description, location: j.location, employment_type: j.employment_type, salary_range: j.salary_range, status: j.status, created_at: j.created_at, updated_at: j.updated_at };
		const { data, error } = await svc.from('jobs').insert(payload).select().maybeSingle();
		if (error) throw error;
		jobMap[j.id] = data.id;
		console.log('Created job', j.title);
	}

	// 6. Candidates
	for (const c of state.candidates) {
		const mappedCustomerId = customerMap[c.customer_id];
		const mappedJobId = jobMap[c.job_id];
		const payload: any = { customer_id: mappedCustomerId, job_id: mappedJobId, first_name: c.first_name, last_name: c.last_name, email: c.email, phone: c.phone, linkedin_url: c.linkedin_url, portfolio_url: c.portfolio_url, location: c.location, resume_path: c.resume_path, stage: c.stage, notes: c.notes, created_at: c.created_at, updated_at: c.updated_at };
		const { data, error } = await svc.from('candidates').insert(payload).select().maybeSingle();
		if (error) throw error;
		candidateMap[c.id] = data.id;
		console.log('Created candidate', c.email);
	}

	// 7. AI Assessments
	for (const a of state.ai_assessments) {
		const mappedCandidateId = candidateMap[a.candidate_id];
		const mappedJobId = jobMap[a.job_id];
		const payload: any = { candidate_id: mappedCandidateId, job_id: mappedJobId, score: a.score, summary: a.summary, strengths: a.strengths, gaps: a.gaps, created_at: a.created_at };
		const { data, error } = await svc.from('ai_assessments').insert(payload).select().maybeSingle();
		if (error) throw error;
		console.log('Created AI assessment for candidate', mappedCandidateId);
	}

	console.log('\n✅ Supabase seeding complete.');
}

async function run() {
	if (isSupabaseEnabled) {
		try {
			await seedSupabase();
		} catch (err: any) {
			console.error('Supabase seeding failed:', err.message || err);
			process.exit(1);
		}
		return;
	}

	console.log('=== TalentTrack Seeding Demo Data (local JSON) ===');
	db.resetToSeed();
	console.log('✅ Demo database seeded successfully with:');
	console.log('  • Customer: Acme Recruitment');
	console.log('  • Admin User: admin@talenttrack.io (Password123!)');
	console.log('  • Customer User: recruiter@acme.com (Password123!)');
	console.log('  • 3 Jobs: Product Manager (Open), Software Engineer (Open), Business Analyst (Closed)');
	console.log('  • 10 Realistic Candidates across all 6 Kanban stages');
	console.log('  • AI Assessment for David Kim (Score 88/100)');
}

run().catch(err => {
	console.error('Seed failed:', err);
	process.exit(1);
});
