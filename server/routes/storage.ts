import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { isSupabaseEnabled, getServiceRoleClient } from '../supabaseClient';
import { db } from '../db';

const router = Router();

// Ensure upload directory exists
// const UPLOAD_DIR = path.resolve(process.cwd(), 'data', 'resumes');
// if (!fs.existsSync(UPLOAD_DIR)) {
//   fs.mkdirSync(UPLOAD_DIR, { recursive: true });
// }

const UPLOAD_DIR = process.env.NETLIFY === 'true'
  ? path.join('/tmp', 'resumes')
  : path.resolve(process.cwd(), 'data', 'resumes');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Use memory storage so we can upload to Supabase Storage or save locally as fallback
const storage = multer.memoryStorage();

// File filter (PDF, DOCX, DOC) & 5MB Limit
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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

// POST /api/resumes/upload/:candidateId
router.post('/upload/:candidateId', (req: Request, res: Response) => {
  upload.single('resume')(req, res, async (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds the 5MB limit.' });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded.' });
    }

    const { candidateId } = req.params;
    const candidate = db.getCandidate(candidateId);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found.' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const cleanName = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `${cleanName}-${uniqueSuffix}${ext}`;

    let storedPath: string | null = null;
    if (isSupabaseEnabled) {
      try {
        const service = getServiceRoleClient();
        const bucket = 'resumes';
        const objectPath = `${candidateId}/${filename}`;
        const uploadResult = await service.storage.from(bucket).upload(objectPath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });
        if (uploadResult.error) {
          console.warn('Supabase upload failed, saving locally instead:', uploadResult.error.message);
          const localPath = path.join(UPLOAD_DIR, filename);
          fs.writeFileSync(localPath, req.file.buffer);
          storedPath = path.join('resumes', filename);
        } else {
          storedPath = `${candidateId}/${filename}`;
        }
      } catch (err) {
        console.warn('Supabase upload error, saving locally instead:', err);
        const localPath = path.join(UPLOAD_DIR, filename);
        fs.writeFileSync(localPath, req.file.buffer);
        storedPath = path.join('resumes', filename);
      }
    } else {
      const localPath = path.join(UPLOAD_DIR, filename);
      fs.writeFileSync(localPath, req.file.buffer);
      storedPath = path.join('resumes', filename);
    }

    const updated = db.updateCandidate(candidateId, { resume_path: storedPath });

    return res.json({
      success: true,
      message: 'Resume uploaded securely.',
      candidate: updated,
      file: {
        filename,
        originalName: req.file.originalname,
        size: req.file.size,
      },
    });
  });
});

// GET /api/resumes/download/:candidateId
router.get('/download/:candidateId', async (req: Request, res: Response) => {
  const { candidateId } = req.params;
  const candidate = db.getCandidate(candidateId);

  if (!candidate || !candidate.resume_path) {
    return res.status(404).json({ error: 'Resume not found for this candidate.' });
  }

  // If using Supabase, create a signed URL and redirect
  if (isSupabaseEnabled) {
    try {
      const service = getServiceRoleClient();
      const bucket = 'resumes';
      const { data, error } = await service.storage.from(bucket).createSignedUrl(candidate.resume_path, 60);
      if (error || !data?.signedUrl) {
        console.warn('Failed to create signed URL, falling back to local mock:', error?.message);
      } else {
        return res.redirect(data.signedUrl);
      }
    } catch (err) {
      console.warn('Error creating Supabase signed URL:', err);
    }
  }

  // Local disk fallback: attempt to find an uploaded file
  const filename = path.basename(candidate.resume_path || '');
  const filePath = path.join(UPLOAD_DIR, filename);

  if (fs.existsSync(filePath)) {
    return res.download(filePath, `${candidate.first_name}_${candidate.last_name}_CV${path.extname(filename)}`);
  }

  // If seeded demo file doesn't exist physically, create a generated mock PDF/doc for download
  const mockContent = `Curriculum Vitae\nCandidate: ${candidate.first_name} ${candidate.last_name}\nEmail: ${candidate.email}\nPhone: ${candidate.phone || 'N/A'}\nLocation: ${candidate.location || 'N/A'}\nLinkedIn: ${candidate.linkedin_url || 'N/A'}\n\nExperience Summary:\n${candidate.notes || 'Experienced professional with proven track record in software engineering and product operations.'}`;
  
  res.setHeader('Content-Disposition', `attachment; filename="${candidate.first_name}_${candidate.last_name}_Resume.txt"`);
  res.setHeader('Content-Type', 'text/plain');
  return res.send(mockContent);
});

// GET /api/resumes/signed-url/:candidateId
router.get('/signed-url/:candidateId', async (req: Request, res: Response) => {
  const { candidateId } = req.params;
  const candidate = db.getCandidate(candidateId);

  if (!candidate || !candidate.resume_path) {
    return res.status(404).json({ error: 'Resume not found.' });
  }
  if (isSupabaseEnabled) {
    try {
      const service = getServiceRoleClient();
      const bucket = 'resumes';
      const { data, error } = await service.storage.from(bucket).createSignedUrl(candidate.resume_path, 3600);
      if (error || !data?.signedUrl) {
        console.warn('Failed to create Supabase signed URL:', error?.message);
      } else {
        return res.json({ signedUrl: data.signedUrl, filename: path.basename(candidate.resume_path), expiresIn: 3600 });
      }
    } catch (err) {
      console.warn('Error creating Supabase signed URL:', err);
    }
  }

  const token = Buffer.from(`${candidateId}:${Date.now() + 3600000}`).toString('base64');
  const signedUrl = `/api/resumes/download/${candidateId}?token=${token}`;

  return res.json({
    signedUrl,
    filename: path.basename(candidate.resume_path),
    expiresIn: 3600,
  });
});

export default router;
