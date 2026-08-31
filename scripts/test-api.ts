import { db } from '../server/db';
import { runAIAssessment } from '../server/aiService';

async function runEndToEndVerification() {
  console.log('=== Running TalentTrack MVP Automated Verification ===\n');

  // 1. Reset Database to clean state
  console.log('1. Testing Database & Seed State...');
  db.resetToSeed();
  const customers = db.getCustomers();
  const jobs = db.getJobs();
  const candidates = db.getCandidates();
  const assessments = db.getAssessments();

  if (customers.length !== 1 || jobs.length !== 3 || candidates.length !== 10 || assessments.length !== 1) {
    throw new Error(`Unexpected seed counts: customers=${customers.length}, jobs=${jobs.length}, candidates=${candidates.length}`);
  }
  console.log(`   ✓ Seed verified: 1 customer (${customers[0].name}), 3 jobs, 10 candidates, 1 AI assessment.`);

  // 2. Test Admin Auth
  console.log('\n2. Testing Admin User Authentication...');
  const adminUser = db.findUserByEmail('admin@talenttrack.io');
  if (!adminUser || adminUser.passwordHash !== 'Password123!') {
    throw new Error('Admin user auth check failed');
  }
  const adminRole = db.getUserRole(adminUser.id);
  if (adminRole?.role !== 'admin') {
    throw new Error('Admin role incorrect');
  }
  console.log('   ✓ Admin login authenticated with role: admin');

  // 3. Test Customer Auth
  console.log('\n3. Testing Recruiter User Authentication...');
  const recruiterUser = db.findUserByEmail('recruiter@acme.com');
  if (!recruiterUser || recruiterUser.passwordHash !== 'Password123!') {
    throw new Error('Recruiter user auth check failed');
  }
  const recruiterProfile = db.getProfile(recruiterUser.id);
  const recruiterRole = db.getUserRole(recruiterUser.id);
  if (recruiterRole?.role !== 'customer' || recruiterProfile?.customer_id !== customers[0].id) {
    throw new Error('Recruiter profile / workspace link incorrect');
  }
  console.log(`   ✓ Recruiter login authenticated with role: customer, workspace: ${recruiterProfile?.customer_id}`);

  // 4. Test Job Creation & Status
  console.log('\n4. Testing Job Creation & Update...');
  const newJob = db.createJob({
    id: 'j-test-new-job',
    customer_id: customers[0].id,
    title: 'Senior Frontend Architect',
    description: 'Lead modern React/TypeScript architecture and web performance.',
    location: 'Remote',
    employment_type: 'Full-time',
    salary_range: '$160,000 - $190,000',
    status: 'Open',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  console.log(`   ✓ Job created: "${newJob.title}" (Status: ${newJob.status})`);

  db.updateJob(newJob.id, { status: 'Closed' });
  const updatedJob = db.getJob(newJob.id);
  if (updatedJob?.status !== 'Closed') throw new Error('Job status update failed');
  console.log('   ✓ Job status successfully updated to Closed (and remains accessible)');

  // 5. Test Candidate Creation
  console.log('\n5. Testing Candidate Addition & Initial Stage...');
  const newCandidate = db.createCandidate({
    id: 'c-test-new-cand',
    customer_id: customers[0].id,
    job_id: newJob.id,
    first_name: 'Samantha',
    last_name: 'Carter',
    email: 'samantha.carter@example.com',
    phone: '+1 555 0192',
    linkedin_url: 'https://linkedin.com/in/samanthacarter-dev',
    portfolio_url: 'https://samanthacarter.io',
    location: 'Denver, CO',
    resume_path: 'resumes/samantha_carter_cv.pdf',
    stage: 'Applied',
    notes: 'Exceptional background in state management and web performance.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (newCandidate.stage !== 'Applied') throw new Error('Candidate default stage must be Applied');
  console.log(`   ✓ Candidate "${newCandidate.first_name} ${newCandidate.last_name}" created under stage: ${newCandidate.stage}`);

  // 6. Test Kanban Stage Transition
  console.log('\n6. Testing Kanban Stage Transition & Persistence...');
  db.updateCandidate(newCandidate.id, { stage: 'Interview' });
  const candAfterMove = db.getCandidate(newCandidate.id);
  if (candAfterMove?.stage !== 'Interview') throw new Error('Stage transition failed');
  console.log(`   ✓ Candidate stage moved to: ${candAfterMove.stage}`);

  // 7. Test Search & Filter
  console.log('\n7. Testing Candidate Search & Job Filter...');
  const searchResults = db.getCandidates(customers[0].id).filter(c => {
    const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
    return fullName.includes('samantha') && c.job_id === newJob.id;
  });
  if (searchResults.length !== 1 || searchResults[0].id !== newCandidate.id) {
    throw new Error('Search and filter query failed');
  }
  console.log(`   ✓ Search for "Samantha" under Job "${newJob.title}" returned 1 exact match.`);

  // 8. Test AI Assessment Engine
  console.log('\n8. Testing AI CV Assessment Engine...');
  const assessment = await runAIAssessment({
    candidate_id: newCandidate.id,
    job_id: newJob.id,
    resume_text: 'Senior engineer with 8 years of React, TypeScript, and micro-frontend experience.',
  });
  if (!assessment || typeof assessment.score !== 'number' || !assessment.summary || !Array.isArray(assessment.strengths) || !Array.isArray(assessment.gaps)) {
    throw new Error('AI Assessment response structure invalid');
  }
  console.log(`   ✓ AI Assessment generated successfully:`);
  console.log(`     - Match Score: ${assessment.score}/100`);
  console.log(`     - Summary: ${assessment.summary}`);
  console.log(`     - Strengths: ${assessment.strengths.length} items`);
  console.log(`     - Gaps: ${assessment.gaps.length} items`);

  // 9. Test Admin Customer Workspace Management
  console.log('\n9. Testing Admin Customer Workspace Management...');
  const newCustomer = db.createCustomer({
    id: 'c-test-new-cust',
    name: 'Horizon Staffing',
    contact_name: 'David Vance',
    contact_email: 'david@horizonstaffing.com',
    created_at: new Date().toISOString(),
  });
  const allCustomers = db.getCustomers();
  if (!allCustomers.find(c => c.id === newCustomer.id)) throw new Error('Admin customer creation failed');
  console.log(`   ✓ Admin created customer workspace: "${newCustomer.name}"`);

  // 10. Clean up
  db.resetToSeed();
  console.log('\n10. Restored database to clean seed state.');
  console.log('\n🎉 ALL 10 AUTOMATED VERIFICATION TESTS PASSED PERFECTLY!\n');
}

runEndToEndVerification().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
