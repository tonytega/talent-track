import { Router, Request, Response } from 'express';
import { db, Job, Candidate } from '../db';
import crypto from 'crypto';
import { isSupabaseEnabled, getServiceRoleClient } from '../supabaseClient';
import * as supaDb from '../supabaseDb';

const router = Router();

// Helper to extract workspace context
async function getWorkspaceContext(req: Request): Promise<{ customerId: string | null; isAdmin: boolean }> {
  const userId = (req.headers['x-user-id'] as string) || '';
  const impersonatedCustomerId = req.headers['x-customer-id'] as string;

  if (isSupabaseEnabled) {
    const role = await supaDb.getUserRole(userId);
    const isAdmin = role?.role === 'admin';
    const profile = await supaDb.getProfile(userId);

    console.log('getWorkspaceContext: userId=', userId);
    console.log('getWorkspaceContext: role=', role);
    console.log('getWorkspaceContext: profile=', profile);

    let customerId: string | null = null;
    if (isAdmin) {
      customerId = impersonatedCustomerId || null;
    } else if (profile) {
      customerId = profile.customer_id;
    }

    return { customerId, isAdmin };
  }

  const role = db.getUserRole(userId);
  const isAdmin = role?.role === 'admin';
  const profile = db.getProfile(userId);

  let customerId: string | null = null;
  if (isAdmin) {
    customerId = impersonatedCustomerId || null;
  } else if (profile) {
    customerId = profile.customer_id;
  }

  return { customerId, isAdmin };
}

// ----------------------------------------------------
// DASHBOARD STATS
// ----------------------------------------------------
router.get('/dashboard/stats', async (req: Request, res: Response) => {
  try {
    const { customerId, isAdmin } = await getWorkspaceContext(req);

    if (!isAdmin && !customerId) {
      return res.status(403).json({ error: 'No customer workspace associated with this user.' });
    }

    const targetCustomerId = customerId || (isAdmin ? req.query.customerId as string : null);
    const jobs = isSupabaseEnabled ? await supaDb.getJobs(targetCustomerId || undefined) : db.getJobs(targetCustomerId || undefined);
    const candidates = isSupabaseEnabled ? await supaDb.getCandidates(targetCustomerId || undefined) : db.getCandidates(targetCustomerId || undefined);

    const activeJobs = jobs.filter(j => j.status === 'Open');
    const interviewCount = candidates.filter(c => c.stage === 'Interview').length;
    const hiredCount = candidates.filter(c => c.stage === 'Hired').length;

    // Recent candidates (last 5 sorted by created_at desc)
    const recentCandidates = [...candidates]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(c => {
        const job = jobs.find(j => j.id === c.job_id);
        return {
          ...c,
          job_title: job ? job.title : 'Unassigned Job',
        };
      });

    // Active jobs list with candidate count
    const activeJobsList = activeJobs.map(j => {
      const jobCandidates = candidates.filter(c => c.job_id === j.id);
      return {
        ...j,
        candidate_count: jobCandidates.length,
      };
    });

    return res.json({
      stats: {
        active_jobs: activeJobs.length,
        total_candidates: candidates.length,
        in_interview: interviewCount,
        hired: hiredCount,
      },
      recent_candidates: recentCandidates,
      active_jobs: activeJobsList,
    });
  } catch (err: any) {
    console.error('Error fetching dashboard stats:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch stats' });
  }
});

// ----------------------------------------------------
// JOBS
// ----------------------------------------------------
router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const { customerId, isAdmin } = await getWorkspaceContext(req);
    const requestedCustomerId = (req.query.customerId as string) || customerId;

    let jobs: Job[] = [];
    if (isSupabaseEnabled) {
      jobs = await supaDb.getJobs(requestedCustomerId || undefined);
    } else {
      if (isAdmin && !requestedCustomerId) {
        jobs = db.getJobs();
      } else if (requestedCustomerId) {
        jobs = db.getJobs(requestedCustomerId);
      }
    }

    const candidates = isSupabaseEnabled ? await supaDb.getCandidates() : db.getCandidates();
    const result = jobs.map(j => {
      const count = candidates.filter(c => c.job_id === j.id).length;
      return {
        ...j,
        candidate_count: count,
      };
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch jobs' });
  }
});

// Debug: report whether server is using Supabase or local JSON
router.get('/debug/mode', async (_req: Request, res: Response) => {
  try {
    return res.json({ isSupabaseEnabled });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to get debug mode' });
  }
});

// Debug: list jobs for a given customerId using service role (bypass workspace context)
router.get('/debug/jobs', async (req: Request, res: Response) => {
  try {
    const customerId = req.query.customerId as string | undefined;
    const jobs = isSupabaseEnabled ? await supaDb.getJobs(customerId) : db.getJobs(customerId);
    return res.json(jobs);
  } catch (err: any) {
    console.error('Debug jobs error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch jobs' });
  }
});

router.get('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const job = isSupabaseEnabled ? await supaDb.getJob(req.params.id) : db.getJob(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const candidates = isSupabaseEnabled ? await supaDb.getCandidates(undefined, job.id) : db.getCandidates(undefined, job.id);
    return res.json({ ...job, candidate_count: candidates.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch job' });
  }
});

router.post('/jobs', async (req: Request, res: Response) => {
  try {
    const { customerId, isAdmin } = await getWorkspaceContext(req);
    const { title, description, location, employment_type, salary_range, status, customer_id } = req.body;

    const targetCustomerId = (isAdmin && customer_id) ? customer_id : customerId;
    if (!targetCustomerId) {
      return res.status(400).json({ error: 'Customer ID is required.' });
    }

    if (!title || !description || !location || !employment_type) {
      return res.status(400).json({ error: 'Title, description, location, and employment type are required.' });
    }

    const newJob: Job = {
      id: isSupabaseEnabled ? crypto.randomUUID() : 'j' + crypto.randomUUID().substring(1),
      customer_id: targetCustomerId,
      title,
      description,
      location,
      employment_type: employment_type || 'Full-time',
      salary_range: salary_range || null,
      status: status || 'Open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const saved = isSupabaseEnabled ? await supaDb.createJob(newJob) : db.createJob(newJob);
    return res.status(201).json({ ...saved, candidate_count: 0 });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create job' });
  }
});

router.put('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = isSupabaseEnabled ? await supaDb.getJob(id) : db.getJob(id);
    if (!existing) return res.status(404).json({ error: 'Job not found' });

    const { customerId, isAdmin } = await getWorkspaceContext(req);
    if (!isAdmin && existing.customer_id !== customerId) {
      return res.status(403).json({ error: 'Forbidden. You can only edit jobs in your workspace.' });
    }

    const updated = isSupabaseEnabled ? await supaDb.updateJob(id, req.body) : db.updateJob(id, req.body);
    const count = isSupabaseEnabled ? (await supaDb.getCandidates(undefined, id)).length : db.getCandidates(undefined, id).length;
    return res.json({ ...updated, candidate_count: count });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update job' });
  }
});

router.delete('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = isSupabaseEnabled ? await supaDb.getJob(id) : db.getJob(id);
    if (!existing) return res.status(404).json({ error: 'Job not found' });

    const { customerId, isAdmin } = await getWorkspaceContext(req);
    if (!isAdmin && existing.customer_id !== customerId) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    if (isSupabaseEnabled) await supaDb.deleteJob(id); else db.deleteJob(id);
    return res.json({ success: true, message: 'Job deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to delete job' });
  }
});

// ----------------------------------------------------
// CANDIDATES
// ----------------------------------------------------
router.get('/candidates', async (req: Request, res: Response) => {
  try {
    const { customerId } = await getWorkspaceContext(req);
    const requestedCustomerId = (req.query.customerId as string) || customerId;
    const jobId = req.query.jobId as string;
    const search = (req.query.search as string || '').toLowerCase().trim();

    let candidates = isSupabaseEnabled ? await supaDb.getCandidates(requestedCustomerId || undefined, jobId || undefined) : db.getCandidates(requestedCustomerId || undefined, jobId || undefined);

    if (search) {
      candidates = candidates.filter((c: any) => {
        const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
        return (
          c.first_name.toLowerCase().includes(search) ||
          c.last_name.toLowerCase().includes(search) ||
          fullName.includes(search) ||
          c.email.toLowerCase().includes(search)
        );
      });
    }

    const jobs = isSupabaseEnabled ? await supaDb.getJobs() : db.getJobs();
    const assessments = isSupabaseEnabled ? await supaDb.getAssessments() : db.getAssessments();

    const enriched = candidates.map((c: any) => {
      const job = jobs.find(j => j.id === c.job_id);
      const candAssessments = assessments
        .filter((a: any) => a.candidate_id === c.id)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      return {
        ...c,
        job_title: job ? job.title : 'Unassigned',
        latest_assessment: candAssessments[0] || null,
      };
    });

    return res.json(enriched);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch candidates' });
  }
});

router.get('/candidates/:id', async (req: Request, res: Response) => {
  try {
    const candidate = isSupabaseEnabled ? await supaDb.getCandidate(req.params.id) : db.getCandidate(req.params.id);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    const job = isSupabaseEnabled ? await supaDb.getJob(candidate.job_id) : db.getJob(candidate.job_id);
    const latestAssessment = isSupabaseEnabled ? await supaDb.getLatestAssessment(candidate.id) : db.getLatestAssessment(candidate.id);

    return res.json({
      ...candidate,
      job_title: job ? job.title : 'Unassigned',
      job,
      latest_assessment: latestAssessment || null,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch candidate' });
  }
});

router.post('/candidates', async (req: Request, res: Response) => {
  try {
    const { customerId, isAdmin } = await getWorkspaceContext(req);
    const {
      first_name,
      last_name,
      email,
      job_id,
      phone,
      linkedin_url,
      portfolio_url,
      location,
      notes,
      stage,
      customer_id,
    } = req.body;

    const targetCustomerId = (isAdmin && customer_id) ? customer_id : customerId;
    if (!targetCustomerId) {
      return res.status(400).json({ error: 'Customer workspace context missing.' });
    }

    if (!first_name || !last_name || !email || !job_id) {
      return res.status(400).json({ error: 'First name, last name, email, and job are required.' });
    }

    const newCandidate: Candidate = {
      id: isSupabaseEnabled ? crypto.randomUUID() : 'd' + crypto.randomUUID().substring(1),
      customer_id: targetCustomerId,
      job_id,
      first_name,
      last_name,
      email,
      phone: phone || null,
      linkedin_url: linkedin_url || null,
      portfolio_url: portfolio_url || null,
      location: location || null,
      resume_path: null,
      stage: stage || 'Applied',
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const saved = isSupabaseEnabled ? await supaDb.createCandidate(newCandidate) : db.createCandidate(newCandidate);
    const job = isSupabaseEnabled ? await supaDb.getJob((saved as any).job_id) : db.getJob(saved.job_id);

    return res.status(201).json({
      ...(saved as any),
      job_title: job ? job.title : 'Unassigned',
      latest_assessment: null,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create candidate' });
  }
});

router.put('/candidates/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = isSupabaseEnabled ? await supaDb.getCandidate(id) : db.getCandidate(id);
    if (!existing) return res.status(404).json({ error: 'Candidate not found' });

    const { customerId, isAdmin } = await getWorkspaceContext(req);
    if (!isAdmin && existing.customer_id !== customerId) {
      return res.status(403).json({ error: 'Forbidden. Candidate belongs to another workspace.' });
    }

    const updated = isSupabaseEnabled ? await supaDb.updateCandidate(id, req.body) : db.updateCandidate(id, req.body);
    const job = isSupabaseEnabled ? await supaDb.getJob((updated as any).job_id) : db.getJob(updated!.job_id);
    const latestAssessment = isSupabaseEnabled ? await supaDb.getLatestAssessment(id) : db.getLatestAssessment(id);

    return res.json({
      ...(updated as any),
      job_title: job ? job.title : 'Unassigned',
      latest_assessment: latestAssessment || null,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update candidate' });
  }
});

router.delete('/candidates/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = isSupabaseEnabled ? await supaDb.getCandidate(id) : db.getCandidate(id);
    if (!existing) return res.status(404).json({ error: 'Candidate not found' });

    const { customerId, isAdmin } = await getWorkspaceContext(req);
    if (!isAdmin && existing.customer_id !== customerId) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    if (isSupabaseEnabled) {
      // Delete via service role client
      const service = getServiceRoleClient();
      const { error } = await service.from('candidates').delete().eq('id', id);
      if (error) throw error;
    } else {
      db.deleteCandidate(id);
    }
    return res.json({ success: true, message: 'Candidate deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to delete candidate' });
  }
});

export default router;
