import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { db, Candidate } from '../db';

const router = Router();

// Ensure upload directory exists
const UPLOAD_DIR = path.resolve(process.cwd(), 'data', 'resumes');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage for public CV uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `public_${cleanName}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = ['.pdf', '.docx', '.doc'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only PDF, DOC, and DOCX files are permitted.'));
    }
  },
});

// GET /api/public/jobs/:jobId
// Retrieves sanitized public job information
router.get('/jobs/:jobId', (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = db.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job opening not found.' });
    }

    const customer = db.getCustomer(job.customer_id);

    // Only expose public-facing job information
    return res.json({
      id: job.id,
      title: job.title,
      description: job.description,
      location: job.location,
      employment_type: job.employment_type,
      salary_range: job.salary_range,
      status: job.status,
      created_at: job.created_at,
      company_name: customer?.name || 'Hiring Organization',
    });
  } catch (err: any) {
    console.error('Error fetching public job:', err);
    return res.status(500).json({ error: 'Failed to retrieve job details.' });
  }
});

// POST /api/public/apply/:jobId
// Processes a candidate public application
router.post('/apply/:jobId', (req: Request, res: Response) => {
  upload.single('resume')(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Resume file exceeds the 5MB size limit.' });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { jobId } = req.params;
      const job = db.getJob(jobId);

      if (!job) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: 'Job opening not found.' });
      }

      // 1. Verify job is currently Open
      if (job.status !== 'Open') {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({
          error: 'This position is no longer accepting applications.',
        });
      }

      const {
        first_name,
        last_name,
        email,
        phone,
        location,
        linkedin_url,
        portfolio_url,
      } = req.body;

      // 2. Validate required fields
      if (!first_name || !first_name.trim() || !last_name || !last_name.trim()) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'First name and last name are required.' });
      }

      if (!email || !email.trim()) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Email address is required.' });
      }

      // Basic email format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }

      // Validate CV file attachment
      if (!req.file) {
        return res.status(400).json({ error: 'Please attach your CV/Resume file (PDF or DOCX).' });
      }

      // 3. Duplicate Application Prevention
      const cleanEmail = email.trim().toLowerCase();
      const existingCandidates = db.getCandidates(job.customer_id, job.id);
      const isDuplicate = existingCandidates.some(
        c => c.email.toLowerCase() === cleanEmail
      );

      if (isDuplicate) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({
          error: 'An application with this email address has already been submitted for this position.',
        });
      }

      // 4. Securely create candidate associated with job.customer_id
      const relativePath = path.join('resumes', req.file.filename);
      const newCandidate: Candidate = {
        id: 'd' + crypto.randomUUID().substring(1),
        customer_id: job.customer_id, // Securely derived server-side
        job_id: job.id,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: cleanEmail,
        phone: phone ? phone.trim() : null,
        location: location ? location.trim() : null,
        linkedin_url: linkedin_url ? linkedin_url.trim() : null,
        portfolio_url: portfolio_url ? portfolio_url.trim() : null,
        resume_path: relativePath,
        stage: 'Applied', // Automatically set to Applied
        notes: 'Applied directly via public job application link.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      db.createCandidate(newCandidate);

      return res.status(201).json({
        success: true,
        message: 'Application submitted successfully. Thank you for applying.',
      });
    } catch (err: any) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      console.error('Error submitting public application:', err);
      return res.status(500).json({ error: 'An unexpected error occurred while submitting your application.' });
    }
  });
});

export default router;
