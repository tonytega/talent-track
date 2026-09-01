import { isSupabaseEnabled, getServiceRoleClient } from './supabaseClient';

export async function getJob(id: string) {
  if (!isSupabaseEnabled) return null;
  const service = getServiceRoleClient();
  const { data, error } = await service.from('jobs').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function getCustomer(id: string) {
  if (!isSupabaseEnabled) return null;
  const service = getServiceRoleClient();
  const { data, error } = await service.from('customers').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function getCandidate(id: string) {
  if (!isSupabaseEnabled) return null;
  const service = getServiceRoleClient();
  const { data, error } = await service.from('candidates').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function createCandidate(candidate: any) {
  if (!isSupabaseEnabled) return null;
  const service = getServiceRoleClient();
  // Don't send client-generated non-UUID ids to Postgres; allow DB to generate id if not a valid UUID
  const payload: any = { ...candidate };
  // Remove id if it looks like a legacy non-UUID
  if (payload.id && payload.id[0] === 'd') {
    delete payload.id;
  }
  const { data, error } = await service.from('candidates').insert(payload).select().maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function updateCandidate(id: string, updates: any) {
  if (!isSupabaseEnabled) return null;
  const service = getServiceRoleClient();
  const { data, error } = await service.from('candidates').update(updates).eq('id', id).select().maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function createAssessment(assessment: any) {
  if (!isSupabaseEnabled) return null;
  const service = getServiceRoleClient();
  const { data, error } = await service.from('ai_assessments').insert(assessment).select().maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function getLatestAssessment(candidateId: string) {
  if (!isSupabaseEnabled) return null;
  const service = getServiceRoleClient();
  const { data, error } = await service
    .from('ai_assessments')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

// --- Customers / Profiles / Roles ---
export async function createCustomer(customer: any) {
  if (!isSupabaseEnabled) return null;
  const service = getServiceRoleClient();
  const { data, error } = await service.from('customers').insert(customer).select().maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function getCustomers() {
  if (!isSupabaseEnabled) return [];
  const service = getServiceRoleClient();
  const { data, error } = await service.from('customers').select('*');
  if (error) throw error;
  return data || [];
}

export async function createProfile(profile: any) {
  if (!isSupabaseEnabled) return null;
  const service = getServiceRoleClient();
  const { data, error } = await service.from('profiles').insert(profile).select().maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function getProfile(id: string) {
  if (!isSupabaseEnabled) return null;
  const service = getServiceRoleClient();
  const { data, error } = await service.from('profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function createUserRole(role: any) {
  if (!isSupabaseEnabled) return null;
  const service = getServiceRoleClient();
  const { data, error } = await service.from('user_roles').insert(role).select().maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function getUserRole(userId: string) {
  if (!isSupabaseEnabled) return null;
  const service = getServiceRoleClient();
  const { data, error } = await service.from('user_roles').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data || null;
}

// --- Jobs ---
export async function getJobs(customerId?: string) {
  if (!isSupabaseEnabled) return [];
  const service = getServiceRoleClient();
  let query = service.from('jobs').select('*');
  if (customerId) query = query.eq('customer_id', customerId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createJob(job: any) {
  if (!isSupabaseEnabled) return null;
  const service = getServiceRoleClient();
  const { data, error } = await service.from('jobs').insert(job).select().maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function updateJob(id: string, updates: any) {
  if (!isSupabaseEnabled) return null;
  const service = getServiceRoleClient();
  const { data, error } = await service.from('jobs').update(updates).eq('id', id).select().maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function deleteJob(id: string) {
  if (!isSupabaseEnabled) return false;
  const service = getServiceRoleClient();
  const { error } = await service.from('jobs').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// --- Candidates list / search / assessments ---
export async function getCandidates(customerId?: string, jobId?: string) {
  if (!isSupabaseEnabled) return [];
  const service = getServiceRoleClient();
  let query = service.from('candidates').select('*');
  if (customerId) query = query.eq('customer_id', customerId);
  if (jobId) query = query.eq('job_id', jobId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getAssessments(candidateId?: string) {
  if (!isSupabaseEnabled) return [];
  const service = getServiceRoleClient();
  let query = service.from('ai_assessments').select('*');
  if (candidateId) query = query.eq('candidate_id', candidateId);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export default {
  getJob,
  getCustomer,
  getCandidate,
  createCandidate,
  updateCandidate,
  createAssessment,
  getLatestAssessment,
};
