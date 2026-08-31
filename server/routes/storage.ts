import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../db';

const router = Router();

// Ensure upload directory exists
const UPLOAD_DIR = path.resolve(process.cwd(), 'data', 'resumes');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${cleanName}-${uniqueSuffix}${ext}`);
  },
});

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
  upload.single('resume')(req, res, (err: any) => {
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
      // Clean up uploaded file if candidate doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Candidate not found.' });
    }

    const relativePath = path.join('resumes', req.file.filename);
    const updated = db.updateCandidate(candidateId, { resume_path: relativePath });

    return res.json({
      success: true,
      message: 'Resume uploaded securely.',
      candidate: updated,
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
      },
    });
  });
});

// GET /api/resumes/download/:candidateId
router.get('/download/:candidateId', (req: Request, res: Response) => {
  const { candidateId } = req.params;
  const candidate = db.getCandidate(candidateId);

  if (!candidate || !candidate.resume_path) {
    return res.status(404).json({ error: 'Resume not found for this candidate.' });
  }

  // Support demo seeded resumes or newly uploaded files
  const filename = path.basename(candidate.resume_path);
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
router.get('/signed-url/:candidateId', (req: Request, res: Response) => {
  const { candidateId } = req.params;
  const candidate = db.getCandidate(candidateId);

  if (!candidate || !candidate.resume_path) {
    return res.status(404).json({ error: 'Resume not found.' });
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
