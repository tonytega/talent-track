// import { db, AIAssessment } from './db';
// import { isSupabaseEnabled } from './supabaseClient';
// import * as supaDb from './supabaseDb';
// import crypto from 'crypto';

// interface AssessInput {
//   candidate_id: string;
//   job_id: string;
//   resume_text?: string;
// }

// export async function runAIAssessment(input: AssessInput): Promise<AIAssessment> {
//   let candidate: any = null;
//   let job: any = null;
//   if (isSupabaseEnabled) {
//     candidate = await supaDb.getCandidate(input.candidate_id);
//     job = await supaDb.getJob(input.job_id);
//   } else {
//     candidate = db.getCandidate(input.candidate_id);
//     job = db.getJob(input.job_id);
//   }

//   if (!candidate) {
//     throw new Error('Candidate not found');
//   }

//   if (!job) {
//     throw new Error('Job not found');
//   }

//   const geminiApiKey = process.env.GEMINI_API_KEY;

//   let assessmentResult: {
//     score: number;
//     summary: string;
//     strengths: string[];
//     gaps: string[];
//   };

//   if (geminiApiKey && geminiApiKey.trim().length > 5) {
//     try {
//       assessmentResult = await callGeminiAPI(geminiApiKey, candidate, job, input.resume_text);
//       console.warn('Gemini AI assessment result:', assessmentResult);
//     } catch (err) {
//       console.warn('Gemini API call failed, falling back to intelligent ATS heuristics:', err);
//       assessmentResult = generateHeuristicAssessment(candidate, job, input.resume_text);
//     }
//   } else {
//     // High-fidelity heuristic engine
//     assessmentResult = generateHeuristicAssessment(candidate, job, input.resume_text);
//     console.warn('Heuristic AI assessment result:', assessmentResult);
//   }

//   // Create assessment record
//   const assessment: AIAssessment = {
//     id: 'a' + crypto.randomUUID().substring(1),
//     candidate_id: candidate.id,
//     job_id: job.id,
//     score: assessmentResult.score,
//     summary: assessmentResult.summary,
//     strengths: assessmentResult.strengths,
//     gaps: assessmentResult.gaps,
//     created_at: new Date().toISOString(),
//   };

//   if (isSupabaseEnabled) {
//     await supaDb.createAssessment(assessment);
//     return assessment;
//   }

//   db.createAssessment(assessment);
//   return assessment;
// }

// async function callGeminiAPI(apiKey: string, candidate: any, job: any, resumeText?: string) {
//   const prompt = `
// You are an expert HR and Technical Recruiter AI analyzing candidate suitability for a role.
// Evaluate the candidate's profile and CV against the job requirements.

// Job Title: ${job.title}
// Job Description: ${job.description}
// Job Location: ${job.location}
// Employment Type: ${job.employment_type}

// Candidate Information:
// Name: ${candidate.first_name} ${candidate.last_name}
// Location: ${candidate.location || 'Not specified'}
// LinkedIn: ${candidate.linkedin_url || 'Not provided'}
// Portfolio: ${candidate.portfolio_url || 'Not provided'}
// Recruiter Notes: ${candidate.notes || 'None'}
// Resume Details / Text:
// ${resumeText || candidate.resume_path || 'Standard CV submitted matching profile'}

// Instructions:
// 1. Provide a Match Score from 0 to 100 representing job alignment.
// 2. Provide a 2-3 sentence executive Summary of suitability.
// 3. List 3 to 4 specific Strengths directly relevant to the job requirements.
// 4. List 2 to 3 Potential Gaps or areas for interviewer exploration.
// 5. Only focus on job-relevant skills, experience, and qualifications. Never infer or evaluate protected characteristics.

// Return your response strictly as valid JSON matching this exact structure:
// {
//   "score": 85,
//   "summary": "Concise summary here...",
//   "strengths": ["Strength 1", "Strength 2", "Strength 3"],
//   "gaps": ["Gap 1", "Gap 2"]
// }
// `;

//   const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({
//       contents: [{ parts: [{ text: prompt }] }],
//       generationConfig: { responseMimeType: "application/json" }
//     })
//   });

//   if (!response.ok) {
//     throw new Error(`Gemini API returned status ${response.status}: ${await response.text()}`);
//   }

//   const data = await response.json();
//   const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
//   if (!rawText) throw new Error('Empty response from Gemini API');

//   const parsed = JSON.parse(rawText);
//   return {
//     score: Math.min(100, Math.max(0, Number(parsed.score) || 75)),
//     summary: String(parsed.summary || 'Candidate evaluated for role alignment.'),
//     strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Demonstrated domain experience'],
//     gaps: Array.isArray(parsed.gaps) ? parsed.gaps : ['Verify specific stack familiarity in next interview round']
//   };
// }

// function generateHeuristicAssessment(candidate: any, job: any, resumeText?: string) {
//   const jobTitleLower = job.title.toLowerCase();
//   const notesLower = (candidate.notes || '').toLowerCase();
//   const textCombined = `${candidate.first_name} ${candidate.last_name} ${candidate.location || ''} ${notesLower} ${resumeText || ''}`.toLowerCase();

//   let score = 78;
//   const strengths: string[] = [];
//   const gaps: string[] = [];

//   if (jobTitleLower.includes('product') || jobTitleLower.includes('pm')) {
//     if (textCombined.includes('saas') || textCombined.includes('roadmap') || textCombined.includes('discovery') || textCombined.includes('agile')) {
//       score += 10;
//       strengths.push('Demonstrated SaaS product roadmap ownership & discovery lifecycle experience');
//     } else {
//       strengths.push('Relevant product management fundamentals and stakeholder collaboration');
//     }
//     if (textCombined.includes('sql') || textCombined.includes('amplitude') || textCombined.includes('data') || textCombined.includes('analytics')) {
//       strengths.push('Data-driven mindset with metrics and telemetry analysis expertise');
//     } else {
//       strengths.push('Strong user-centric feature prioritization and backlog management');
//     }
//     if (candidate.portfolio_url || candidate.linkedin_url) {
//       strengths.push('Verified professional portfolio & industry recommendations');
//     }

//     gaps.push('Assess depth with technical API specifications and architectural trade-offs');
//     if (!textCombined.includes('remote') && job.location.toLowerCase().includes('remote')) {
//       gaps.push('Confirm comfort working in asynchronous distributed sprint cadence');
//     } else {
//       gaps.push('Explore past experience navigating competing executive priorities');
//     }
//   } else if (jobTitleLower.includes('engineer') || jobTitleLower.includes('developer') || jobTitleLower.includes('tech')) {
//     if (textCombined.includes('react') || textCombined.includes('typescript') || textCombined.includes('node') || textCombined.includes('full-stack')) {
//       score += 12;
//       strengths.push('Proven proficiency in modern web architecture (TypeScript, React, Node.js)');
//     } else {
//       strengths.push('Strong software engineering fundamentals and clean code principles');
//     }
//     if (textCombined.includes('sql') || textCombined.includes('postgres') || textCombined.includes('database')) {
//       strengths.push('Solid relational database design and API integration capabilities');
//     } else {
//       strengths.push('Experience with agile version control workflows and automated testing');
//     }
//     if (candidate.portfolio_url || candidate.linkedin_url) {
//       strengths.push('Public code repository / portfolio demonstrating practical builds');
//     }

//     gaps.push('Validate distributed systems scale and high-concurrency performance tuning in interview');
//     gaps.push('Discuss hands-on CI/CD pipeline automation and infrastructure familiarity');
//   } else {
//     // General / Business Analyst / Other
//     score = 80;
//     strengths.push(`Strong alignment with core requirements for ${job.title}`);
//     strengths.push('Demonstrated stakeholder communication and requirements gathering');
//     strengths.push('Proven capability in structured documentation and workflow mapping');
//     gaps.push('Review domain-specific tool certifications and recent project case studies');
//     gaps.push('Evaluate adaptation to fast-paced quarterly delivery cycles');
//   }

//   // Adjust score based on profile completeness
//   if (candidate.linkedin_url && candidate.phone) score = Math.min(96, score + 4);
//   if (candidate.notes && candidate.notes.length > 50) score = Math.min(98, score + 3);

//   const summary = `${candidate.first_name} ${candidate.last_name} presents a strong profile for the ${job.title} position, showing notable experience aligned with key deliverables and team responsibilities.`;

//   return {
//     score,
//     summary,
//     strengths,
//     gaps,
//   };
// }








// new code that extract doc and docx text content for AI assessment. This is a placeholder for the actual implementation.


import { db, AIAssessment } from './db';
import {
  isSupabaseEnabled,
  getServiceRoleClient,
} from './supabaseClient';
import * as supaDb from './supabaseDb';
import crypto from 'crypto';

interface AssessInput {
  candidate_id: string;
  job_id: string;
  resume_text?: string;
}

interface AssessmentResult {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
}

export async function runAIAssessment(
  input: AssessInput
): Promise<AIAssessment> {
  let candidate: any = null;
  let job: any = null;

  if (isSupabaseEnabled) {
    candidate = await supaDb.getCandidate(input.candidate_id);
    job = await supaDb.getJob(input.job_id);
  } else {
    candidate = db.getCandidate(input.candidate_id);
    job = db.getJob(input.job_id);
  }

  if (!candidate) {
    throw new Error('Candidate not found');
  }

  if (!job) {
    throw new Error('Job not found');
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;

  let assessmentResult: AssessmentResult;

  if (geminiApiKey && geminiApiKey.trim().length > 5) {
    try {
      console.log(
        `Starting Gemini 2.5 Flash assessment for candidate ${candidate.id}`
      );

      assessmentResult = await callGeminiAPI(
        geminiApiKey,
        candidate,
        job,
        input.resume_text
      );

      console.log(
        `Gemini 2.5 Flash assessment completed successfully for candidate ${candidate.id}`
      );
      console.log('Gemini assessment result:', assessmentResult);
    } catch (err) {
      console.warn(
        'Gemini API call failed, falling back to ATS heuristics:',
        err
      );

      assessmentResult = generateHeuristicAssessment(
        candidate,
        job,
        input.resume_text
      );
    }
  } else {
    assessmentResult = generateHeuristicAssessment(
      candidate,
      job,
      input.resume_text
    );

    console.warn(
      'GEMINI_API_KEY is missing. Using heuristic assessment.'
    );
  }

  const assessment: AIAssessment = {
    id: 'a' + crypto.randomUUID().substring(1),
    candidate_id: candidate.id,
    job_id: job.id,
    score: assessmentResult.score,
    summary: assessmentResult.summary,
    strengths: assessmentResult.strengths,
    gaps: assessmentResult.gaps,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseEnabled) {
    await supaDb.createAssessment(assessment);
    return assessment;
  }

  db.createAssessment(assessment);
  return assessment;
}

async function callGeminiAPI(
  apiKey: string,
  candidate: any,
  job: any,
  resumeText?: string
): Promise<AssessmentResult> {
  const prompt = `
You are an expert HR and Technical Recruiter AI.

Evaluate the candidate's suitability for the job using:
1. The candidate's actual CV/resume content provided below.
2. The job title.
3. The complete job description.
4. The candidate profile information.

IMPORTANT:
- The CV is the primary source for evaluating the candidate's experience.
- Do not invent experience, qualifications, skills, employers, projects, or achievements.
- Do not give credit for a skill unless it is supported by the CV or candidate information.
- Compare the candidate against the actual requirements of the job.
- Only evaluate job-relevant professional qualifications and experience.
- Never infer or evaluate protected characteristics.

JOB INFORMATION

Job Title:
${job.title || 'Not specified'}

Job Description:
${job.description || 'Not specified'}

Job Location:
${job.location || 'Not specified'}

Employment Type:
${job.employment_type || 'Not specified'}


CANDIDATE INFORMATION

Name:
${candidate.first_name || ''} ${candidate.last_name || ''}

Location:
${candidate.location || 'Not specified'}

LinkedIn:
${candidate.linkedin_url || 'Not provided'}

Portfolio:
${candidate.portfolio_url || 'Not provided'}

Recruiter Notes:
${candidate.notes || 'None'}


CV CONTENT

${resumeText || 'The CV is provided separately as a PDF document.'}


TASK

Assess the candidate's match for this specific job.

1. Give a Match Score from 0 to 100.
2. Give a concise 2-3 sentence executive summary.
3. Give 3-4 specific strengths that are directly supported by the CV and relevant to the job.
4. Give 2-3 potential gaps, missing requirements, or areas that should be explored during an interview.
5. Be specific and evidence-based.
6. Do not use generic praise.
7. Do not invent information.

Return ONLY valid JSON using this exact structure:

{
  "score": 85,
  "summary": "Concise evidence-based summary here.",
  "strengths": [
    "Specific strength supported by the CV",
    "Specific strength supported by the CV",
    "Specific strength supported by the CV"
  ],
  "gaps": [
    "Specific gap or area to verify",
    "Specific gap or area to verify"
  ]
}
`;

  /*
   * If resume_text was supplied directly, use it as normal text.
   * Otherwise, if the candidate has a resume stored in Supabase,
   * download the actual file and send the PDF bytes to Gemini.
   */
  let parts: any[] = [];

  if (resumeText && resumeText.trim().length > 0) {
    parts = [
      {
        text: prompt,
      },
    ];
  } else if (
    isSupabaseEnabled &&
    candidate.resume_path
  ) {
    const resumePart = await getResumeForGemini(
      candidate.resume_path
    );

    parts = [
      {
        text: prompt,
      },
      resumePart,
    ];
  } else {
    parts = [
      {
        text: prompt,
      },
    ];
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts,
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Gemini API returned status ${response.status}: ${errorText}`
    );
  }

  const data = await response.json();

  const rawText =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Empty response from Gemini API');
  }

  let parsed: any;

  try {
    parsed = JSON.parse(rawText);
  } catch {
    console.error(
      'Gemini returned invalid JSON:',
      rawText
    );

    throw new Error(
      'Gemini returned an invalid assessment format'
    );
  }

  return {
    score: Math.min(
      100,
      Math.max(0, Number(parsed.score) || 0)
    ),

    summary: String(
      parsed.summary ||
        'Candidate evaluated for role alignment.'
    ),

    strengths: Array.isArray(parsed.strengths)
      ? parsed.strengths.map(String)
      : [],

    gaps: Array.isArray(parsed.gaps)
      ? parsed.gaps.map(String)
      : [],
  };
}


/**
 * Downloads the candidate CV from Supabase Storage
 * and prepares it as Gemini inline document data.
 */
async function getResumeForGemini(
  resumePath: string
) {
  const service = getServiceRoleClient();

  const bucket = 'resumes';

  /*
   * Your storage.ts saves paths in the form:
   *
   * resumes/{candidateId}/{filename}
   *
   * But Supabase Storage expects the path INSIDE
   * the bucket, so remove the "resumes/" prefix.
   */
  let objectPath = resumePath;

  if (objectPath.startsWith(`${bucket}/`)) {
    objectPath = objectPath.substring(
      bucket.length + 1
    );
  }

  console.log(
    `Downloading candidate CV from Supabase Storage: ${objectPath}`
  );

  const { data, error } = await service.storage
    .from(bucket)
    .download(objectPath);

  if (error) {
    throw new Error(
      `Failed to download CV from Supabase Storage: ${error.message}`
    );
  }

  if (!data) {
    throw new Error(
      'Supabase returned an empty CV file'
    );
  }

  const arrayBuffer = await data.arrayBuffer();

  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length === 0) {
    throw new Error(
      'Candidate CV file is empty'
    );
  }

  const extension =
    objectPath.split('.').pop()?.toLowerCase();

  let mimeType = 'application/pdf';

  if (extension === 'pdf') {
    mimeType = 'application/pdf';
  } else if (extension === 'docx') {
    mimeType =
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  } else if (extension === 'doc') {
    mimeType = 'application/msword';
  }

  /*
   * Gemini receives the actual CV bytes here,
   * rather than just the Supabase file path.
   */
  console.log(
    `Sending CV to Gemini 2.5 Flash (${mimeType}, ${buffer.length} bytes)`
  );

  return {
    inline_data: {
      mime_type: mimeType,
      data: buffer.toString('base64'),
    },
  };
}


function generateHeuristicAssessment(
  candidate: any,
  job: any,
  resumeText?: string
): AssessmentResult {
  const jobTitleLower =
    (job.title || '').toLowerCase();

  const notesLower =
    (candidate.notes || '').toLowerCase();

  const textCombined = `
    ${candidate.first_name || ''}
    ${candidate.last_name || ''}
    ${candidate.location || ''}
    ${notesLower}
    ${resumeText || ''}
  `.toLowerCase();

  let score = 78;

  const strengths: string[] = [];
  const gaps: string[] = [];

  if (
    jobTitleLower.includes('product') ||
    jobTitleLower.includes('pm')
  ) {
    if (
      textCombined.includes('saas') ||
      textCombined.includes('roadmap') ||
      textCombined.includes('discovery') ||
      textCombined.includes('agile')
    ) {
      score += 10;

      strengths.push(
        'Demonstrated SaaS product roadmap ownership and discovery lifecycle experience'
      );
    } else {
      strengths.push(
        'Relevant product management fundamentals and stakeholder collaboration'
      );
    }

    if (
      textCombined.includes('sql') ||
      textCombined.includes('amplitude') ||
      textCombined.includes('data') ||
      textCombined.includes('analytics')
    ) {
      strengths.push(
        'Data-driven mindset with metrics and telemetry analysis expertise'
      );
    } else {
      strengths.push(
        'Strong user-centric feature prioritization and backlog management'
      );
    }

    if (
      candidate.portfolio_url ||
      candidate.linkedin_url
    ) {
      strengths.push(
        'Professional portfolio or LinkedIn profile available for verification'
      );
    }

    gaps.push(
      'Assess depth with technical API specifications and architectural trade-offs'
    );

    if (
      !textCombined.includes('remote') &&
      (job.location || '').toLowerCase().includes('remote')
    ) {
      gaps.push(
        'Confirm comfort working in an asynchronous distributed sprint cadence'
      );
    } else {
      gaps.push(
        'Explore past experience navigating competing executive priorities'
      );
    }
  } else if (
    jobTitleLower.includes('engineer') ||
    jobTitleLower.includes('developer') ||
    jobTitleLower.includes('tech')
  ) {
    if (
      textCombined.includes('react') ||
      textCombined.includes('typescript') ||
      textCombined.includes('node') ||
      textCombined.includes('full-stack')
    ) {
      score += 12;

      strengths.push(
        'Proven proficiency in modern web architecture including React, TypeScript, or Node.js'
      );
    } else {
      strengths.push(
        'Strong software engineering fundamentals'
      );
    }

    if (
      textCombined.includes('sql') ||
      textCombined.includes('postgres') ||
      textCombined.includes('database')
    ) {
      strengths.push(
        'Solid relational database design and API integration capabilities'
      );
    } else {
      strengths.push(
        'Experience with agile development workflows and software delivery'
      );
    }

    if (
      candidate.portfolio_url ||
      candidate.linkedin_url
    ) {
      strengths.push(
        'Public portfolio or professional profile available for verification'
      );
    }

    gaps.push(
      'Validate distributed systems scale and high-concurrency performance tuning in interview'
    );

    gaps.push(
      'Discuss hands-on CI/CD pipeline automation and infrastructure familiarity'
    );
  } else {
    score = 80;

    strengths.push(
      `Strong alignment with core requirements for ${job.title}`
    );

    strengths.push(
      'Demonstrated stakeholder communication and requirements gathering'
    );

    strengths.push(
      'Proven capability in structured documentation and workflow mapping'
    );

    gaps.push(
      'Review domain-specific tool certifications and recent project case studies'
    );

    gaps.push(
      'Evaluate adaptation to fast-paced quarterly delivery cycles'
    );
  }

  if (
    candidate.linkedin_url &&
    candidate.phone
  ) {
    score = Math.min(96, score + 4);
  }

  if (
    candidate.notes &&
    candidate.notes.length > 50
  ) {
    score = Math.min(98, score + 3);
  }

  const summary = `
${candidate.first_name} ${candidate.last_name} presents a strong profile for the ${job.title} position, showing notable experience aligned with key deliverables and team responsibilities.
`.trim();

  return {
    score,
    summary,
    strengths,
    gaps,
  };
}
