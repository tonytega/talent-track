import { Router, Request, Response } from 'express';
import { runAIAssessment } from '../aiService';
import { db } from '../db';
import { isSupabaseEnabled } from '../supabaseClient';
import * as supaDb from '../supabaseDb';

const router = Router();

// POST /api/ai/assess
router.post('/assess', async (req: Request, res: Response) => {
  try {
    const { candidate_id, job_id, resume_text } = req.body;

    if (!candidate_id || !job_id) {
      return res.status(400).json({ error: 'candidate_id and job_id are required' });
    }

    const assessment = await runAIAssessment({ candidate_id, job_id, resume_text });

    return res.json({
      success: true,
      assessment,
    });
  } catch (err: any) {
    console.error('Error running AI assessment:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'AI assessment failed. Candidate workflow unaffected.',
    });
  }
});

// GET /api/ai/assessments/:candidateId
router.get('/assessments/:candidateId', async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.params;
    if (isSupabaseEnabled) {
      const latest = await supaDb.getLatestAssessment(candidateId);
      return res.json({ assessment: latest || null });
    }
    const latest = db.getLatestAssessment(candidateId);
    return res.json({ assessment: latest || null });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch assessments' });
  }
});

export default router;
