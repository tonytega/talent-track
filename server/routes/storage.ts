// import { Router, Request, Response } from 'express';
// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';
// import { isSupabaseEnabled, getServiceRoleClient } from '../supabaseClient';
// import { db } from '../db';

// const router = Router();

// // Ensure upload directory exists
// // const UPLOAD_DIR = path.resolve(process.cwd(), 'data', 'resumes');
// // if (!fs.existsSync(UPLOAD_DIR)) {
// //   fs.mkdirSync(UPLOAD_DIR, { recursive: true });
// // }

// const UPLOAD_DIR = '/tmp/resumes';

// if (!fs.existsSync(UPLOAD_DIR)) {
//   fs.mkdirSync(UPLOAD_DIR, { recursive: true });
// }

// // Use memory storage so we can upload to Supabase Storage or save locally as fallback
// const storage = multer.memoryStorage();

// // File filter (PDF, DOCX, DOC) & 5MB Limit
// const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
//   fileFilter: (_req, file, cb) => {
//     const allowedExtensions = ['.pdf', '.docx', '.doc'];
//     const ext = path.extname(file.originalname).toLowerCase();
//     if (allowedExtensions.includes(ext)) {
//       cb(null, true);
//     } else {
//       cb(new Error('Invalid file format. Only PDF, DOC, and DOCX files are permitted.'));
//     }
//   },
// });

// // POST /api/resumes/upload/:candidateId
// router.post('/upload/:candidateId', (req: Request, res: Response) => {
//   upload.single('resume')(req, res, async (err: any) => {
//     if (err instanceof multer.MulterError) {
//       if (err.code === 'LIMIT_FILE_SIZE') {
//         return res.status(400).json({ error: 'File size exceeds the 5MB limit.' });
//       }
//       return res.status(400).json({ error: `Upload error: ${err.message}` });
//     } else if (err) {
//       return res.status(400).json({ error: err.message });
//     }

//     if (!req.file) {
//       return res.status(400).json({ error: 'No resume file uploaded.' });
//     }

//     const { candidateId } = req.params;
//     const candidate = db.getCandidate(candidateId);
//     if (!candidate) {
//       return res.status(404).json({ error: 'Candidate not found.' });
//     }

//     const ext = path.extname(req.file.originalname).toLowerCase();
//     const cleanName = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     const filename = `${cleanName}-${uniqueSuffix}${ext}`;

//     let storedPath: string | null = null;
//     if (isSupabaseEnabled) {
//       try {
//         const service = getServiceRoleClient();
//         const bucket = 'resumes';
//         const objectPath = `${candidateId}/${filename}`;
//         const uploadResult = await service.storage.from(bucket).upload(objectPath, req.file.buffer, {
//           contentType: req.file.mimetype,
//           upsert: false,
//         });
//         if (uploadResult.error) {
//           console.warn('Supabase upload failed, saving locally instead:', uploadResult.error.message);
//           const localPath = path.join(UPLOAD_DIR, filename);
//           fs.writeFileSync(localPath, req.file.buffer);
//           storedPath = path.join('resumes', filename);
//         } else {
//           storedPath = `${candidateId}/${filename}`;
//         }
//       } catch (err) {
//         console.warn('Supabase upload error, saving locally instead:', err);
//         const localPath = path.join(UPLOAD_DIR, filename);
//         fs.writeFileSync(localPath, req.file.buffer);
//         storedPath = path.join('resumes', filename);
//       }
//     } else {
//       const localPath = path.join(UPLOAD_DIR, filename);
//       fs.writeFileSync(localPath, req.file.buffer);
//       storedPath = path.join('resumes', filename);
//     }

//     const updated = db.updateCandidate(candidateId, { resume_path: storedPath });

//     return res.json({
//       success: true,
//       message: 'Resume uploaded securely.',
//       candidate: updated,
//       file: {
//         filename,
//         originalName: req.file.originalname,
//         size: req.file.size,
//       },
//     });
//   });
// });

// // GET /api/resumes/download/:candidateId
// router.get('/download/:candidateId', async (req: Request, res: Response) => {
//   const { candidateId } = req.params;
//   const candidate = db.getCandidate(candidateId);

//   if (!candidate || !candidate.resume_path) {
//     return res.status(404).json({ error: 'Resume not found for this candidate.' });
//   }

//   // If using Supabase, create a signed URL and redirect
//   if (isSupabaseEnabled) {
//     try {
//       const service = getServiceRoleClient();
//       const bucket = 'resumes';
//       const { data, error } = await service.storage.from(bucket).createSignedUrl(candidate.resume_path, 60);
//       if (error || !data?.signedUrl) {
//         console.warn('Failed to create signed URL, falling back to local mock:', error?.message);
//       } else {
//         return res.redirect(data.signedUrl);
//       }
//     } catch (err) {
//       console.warn('Error creating Supabase signed URL:', err);
//     }
//   }

//   // Local disk fallback: attempt to find an uploaded file
//   const filename = path.basename(candidate.resume_path || '');
//   const filePath = path.join(UPLOAD_DIR, filename);

//   if (fs.existsSync(filePath)) {
//     return res.download(filePath, `${candidate.first_name}_${candidate.last_name}_CV${path.extname(filename)}`);
//   }

//   // If seeded demo file doesn't exist physically, create a generated mock PDF/doc for download
//   const mockContent = `Curriculum Vitae\nCandidate: ${candidate.first_name} ${candidate.last_name}\nEmail: ${candidate.email}\nPhone: ${candidate.phone || 'N/A'}\nLocation: ${candidate.location || 'N/A'}\nLinkedIn: ${candidate.linkedin_url || 'N/A'}\n\nExperience Summary:\n${candidate.notes || 'Experienced professional with proven track record in software engineering and product operations.'}`;
  
//   res.setHeader('Content-Disposition', `attachment; filename="${candidate.first_name}_${candidate.last_name}_Resume.txt"`);
//   res.setHeader('Content-Type', 'text/plain');
//   return res.send(mockContent);
// });

// // GET /api/resumes/signed-url/:candidateId
// router.get('/signed-url/:candidateId', async (req: Request, res: Response) => {
//   const { candidateId } = req.params;
//   const candidate = db.getCandidate(candidateId);

//   if (!candidate || !candidate.resume_path) {
//     return res.status(404).json({ error: 'Resume not found.' });
//   }
//   if (isSupabaseEnabled) {
//     try {
//       const service = getServiceRoleClient();
//       const bucket = 'resumes';
//       const { data, error } = await service.storage.from(bucket).createSignedUrl(candidate.resume_path, 3600);
//       if (error || !data?.signedUrl) {
//         console.warn('Failed to create Supabase signed URL:', error?.message);
//       } else {
//         return res.json({ signedUrl: data.signedUrl, filename: path.basename(candidate.resume_path), expiresIn: 3600 });
//       }
//     } catch (err) {
//       console.warn('Error creating Supabase signed URL:', err);
//     }
//   }

//   const token = Buffer.from(`${candidateId}:${Date.now() + 3600000}`).toString('base64');
//   const signedUrl = `/api/resumes/download/${candidateId}?token=${token}`;

//   return res.json({
//     signedUrl,
//     filename: path.basename(candidate.resume_path),
//     expiresIn: 3600,
//   });
// });

// export default router;








import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { isSupabaseEnabled, getServiceRoleClient } from '../supabaseClient';
import { db } from '../db';
import * as supaDb from '../supabaseDb';

const router = Router();

// Local filesystem fallback.
// Netlify's filesystem is temporary, so this is only intended
// for local/non-Supabase operation.
const UPLOAD_DIR = '/tmp/resumes';

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Use memory storage so files can be uploaded directly to Supabase Storage.
const storage = multer.memoryStorage();

// File filter and 5MB limit.
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = ['.pdf', '.docx', '.doc'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Invalid file format. Only PDF, DOC, and DOCX files are permitted.'
        )
      );
    }
  },
});

/**
 * Get a candidate from the correct data source.
 *
 * Supabase mode:
 *   Supabase is the source of truth.
 *
 * Local mode:
 *   Local JSON database is used.
 */
async function getCandidateById(candidateId: string) {
  if (isSupabaseEnabled) {
    return await supaDb.getCandidate(candidateId);
  }

  return db.getCandidate(candidateId);
}

/**
 * Update a candidate in the correct data source.
 */
async function updateCandidateById(
  candidateId: string,
  updates: Record<string, any>
) {
  if (isSupabaseEnabled) {
    return await supaDb.updateCandidate(candidateId, updates);
  }

  return db.updateCandidate(candidateId, updates);
}

/**
 * POST /api/resumes/upload/:candidateId
 *
 * Upload a candidate resume/CV.
 */
router.post(
  '/upload/:candidateId',
  (req: Request, res: Response) => {
    upload.single('resume')(req, res, async (err: any) => {
      try {
        // Handle multer errors.
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              error: 'File size exceeds the 5MB limit.',
            });
          }

          return res.status(400).json({
            error: `Upload error: ${err.message}`,
          });
        }

        if (err) {
          return res.status(400).json({
            error: err.message,
          });
        }

        if (!req.file) {
          return res.status(400).json({
            error: 'No resume file uploaded.',
          });
        }

        const { candidateId } = req.params;

        console.log(
          'Resume upload: looking up candidate:',
          candidateId,
          'Supabase enabled:',
          isSupabaseEnabled
        );

        /**
         * IMPORTANT:
         * Use Supabase candidate data when Supabase is enabled.
         */
        const candidate = await getCandidateById(candidateId);

        if (!candidate) {
          console.warn(
            'Resume upload: candidate not found:',
            candidateId
          );

          return res.status(404).json({
            error: 'Candidate not found.',
          });
        }

        const ext = path
          .extname(req.file.originalname)
          .toLowerCase();

        const cleanName = path
          .basename(req.file.originalname, ext)
          .replace(/[^a-zA-Z0-9_-]/g, '_');

        const uniqueSuffix =
          Date.now() +
          '-' +
          Math.round(Math.random() * 1e9);

        const filename =
          `${cleanName}-${uniqueSuffix}${ext}`;

        let storedPath: string;

        /**
         * SUPABASE STORAGE
         */
        if (isSupabaseEnabled) {
          try {
            const service = getServiceRoleClient();
            const bucket = 'resumes';

            // Keep each candidate's files in their own folder.
            const objectPath = `${candidateId}/${filename}`;

            console.log(
              'Uploading resume to Supabase Storage:',
              objectPath
            );

            const { error: uploadError } =
              await service.storage
                .from(bucket)
                .upload(
                  objectPath,
                  req.file.buffer,
                  {
                    contentType: req.file.mimetype,
                    upsert: false,
                  }
                );

            if (uploadError) {
              console.error(
                'Supabase resume upload failed:',
                uploadError.message
              );

              return res.status(500).json({
                error:
                  'Failed to upload resume to secure storage.',
              });
            }

            storedPath = objectPath;

            console.log(
              'Resume uploaded successfully:',
              storedPath
            );

            /**
             * IMPORTANT:
             * Update the candidate in Supabase, NOT the local DB.
             */
            const updated = await updateCandidateById(
              candidateId,
              {
                resume_path: storedPath,
              }
            );

            if (!updated) {
              console.error(
                'Resume uploaded but candidate could not be updated:',
                candidateId
              );

              // Attempt to remove the orphaned storage object.
              try {
                await service.storage
                  .from(bucket)
                  .remove([objectPath]);
              } catch (cleanupError) {
                console.warn(
                  'Failed to remove orphaned resume:',
                  cleanupError
                );
              }

              return res.status(500).json({
                error:
                  'Resume uploaded, but candidate record could not be updated.',
              });
            }

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
          } catch (storageError: any) {
            console.error(
              'Supabase resume storage error:',
              storageError
            );

            return res.status(500).json({
              error:
                storageError?.message ||
                'Failed to upload resume.',
            });
          }
        }

        /**
         * LOCAL JSON DATABASE MODE
         */
        const localPath = path.join(
          UPLOAD_DIR,
          filename
        );

        fs.writeFileSync(
          localPath,
          req.file.buffer
        );

        storedPath = path.join(
          'resumes',
          filename
        );

        const updated = await updateCandidateById(
          candidateId,
          {
            resume_path: storedPath,
          }
        );

        return res.json({
          success: true,
          message: 'Resume uploaded successfully.',
          candidate: updated,
          file: {
            filename,
            originalName: req.file.originalname,
            size: req.file.size,
          },
        });
      } catch (error: any) {
        console.error(
          'Resume upload route error:',
          error
        );

        return res.status(500).json({
          error:
            error?.message ||
            'Failed to upload resume.',
        });
      }
    });
  }
);

/**
 * GET /api/resumes/download/:candidateId
 *
 * Generates a signed Supabase URL or downloads from local storage.
 */
router.get(
  '/download/:candidateId',
  async (req: Request, res: Response) => {
    try {
      const { candidateId } = req.params;

      const candidate = await getCandidateById(
        candidateId
      );

      if (!candidate || !candidate.resume_path) {
        return res.status(404).json({
          error:
            'Resume not found for this candidate.',
        });
      }

      /**
       * SUPABASE STORAGE
       */
      if (isSupabaseEnabled) {
        try {
          const service =
            getServiceRoleClient();

          const bucket = 'resumes';

          const {
            data,
            error,
          } = await service.storage
            .from(bucket)
            .createSignedUrl(
              candidate.resume_path,
              3600
            );

          if (error || !data?.signedUrl) {
            console.error(
              'Failed to create Supabase signed URL:',
              error?.message
            );

            return res.status(500).json({
              error:
                'Could not generate resume download link.',
            });
          }

          return res.redirect(
            data.signedUrl
          );
        } catch (error: any) {
          console.error(
            'Supabase download error:',
            error
          );

          return res.status(500).json({
            error:
              error?.message ||
              'Could not download resume.',
          });
        }
      }

      /**
       * LOCAL STORAGE
       */
      const filename = path.basename(
        candidate.resume_path
      );

      const filePath = path.join(
        UPLOAD_DIR,
        filename
      );

      if (fs.existsSync(filePath)) {
        return res.download(
          filePath,
          `${candidate.first_name}_${candidate.last_name}_CV${path.extname(
            filename
          )}`
        );
      }

      // Fallback mock content for seeded/demo records.
      const mockContent = `Curriculum Vitae
Candidate: ${candidate.first_name} ${candidate.last_name}
Email: ${candidate.email}
Phone: ${candidate.phone || 'N/A'}
Location: ${candidate.location || 'N/A'}
LinkedIn: ${candidate.linkedin_url || 'N/A'}

Experience Summary:
${
  candidate.notes ||
  'Experienced professional with proven track record in software engineering and product operations.'
}`;

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${candidate.first_name}_${candidate.last_name}_Resume.txt"`
      );

      res.setHeader(
        'Content-Type',
        'text/plain'
      );

      return res.send(mockContent);
    } catch (error: any) {
      console.error(
        'Resume download route error:',
        error
      );

      return res.status(500).json({
        error:
          error?.message ||
          'Failed to download resume.',
      });
    }
  }
);

/**
 * GET /api/resumes/signed-url/:candidateId
 *
 * Returns a temporary signed URL for a candidate resume.
 */
router.get(
  '/signed-url/:candidateId',
  async (req: Request, res: Response) => {
    try {
      const { candidateId } = req.params;

      const candidate = await getCandidateById(
        candidateId
      );

      if (!candidate || !candidate.resume_path) {
        return res.status(404).json({
          error: 'Resume not found.',
        });
      }

      /**
       * SUPABASE STORAGE
       */
      if (isSupabaseEnabled) {
        try {
          const service =
            getServiceRoleClient();

          const bucket = 'resumes';

          const {
            data,
            error,
          } = await service.storage
            .from(bucket)
            .createSignedUrl(
              candidate.resume_path,
              3600
            );

          if (error || !data?.signedUrl) {
            console.error(
              'Failed to create Supabase signed URL:',
              error?.message
            );

            return res.status(500).json({
              error:
                'Could not generate resume download link.',
            });
          }

          return res.json({
            signedUrl:
              data.signedUrl,
            filename:
              path.basename(
                candidate.resume_path
              ),
            expiresIn: 3600,
          });
        } catch (error: any) {
          console.error(
            'Supabase signed URL error:',
            error
          );

          return res.status(500).json({
            error:
              error?.message ||
              'Could not generate resume download link.',
          });
        }
      }

      /**
       * LOCAL FALLBACK
       */
      const token = Buffer.from(
        `${candidateId}:${Date.now() + 3600000}`
      ).toString('base64');

      const signedUrl =
        `/api/resumes/download/${candidateId}?token=${token}`;

      return res.json({
        signedUrl,
        filename: path.basename(
          candidate.resume_path
        ),
        expiresIn: 3600,
      });
    } catch (error: any) {
      console.error(
        'Signed URL route error:',
        error
      );

      return res.status(500).json({
        error:
          error?.message ||
          'Failed to generate signed URL.',
      });
    }
  }
);

export default router;