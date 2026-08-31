import { db } from '../server/db';

console.log('=== TalentTrack Seeding Demo Data ===');
db.resetToSeed();
console.log('✅ Demo database seeded successfully with:');
console.log('  • Customer: Acme Recruitment');
console.log('  • Admin User: admin@talenttrack.io (Password123!)');
console.log('  • Customer User: recruiter@acme.com (Password123!)');
console.log('  • 3 Jobs: Product Manager (Open), Software Engineer (Open), Business Analyst (Closed)');
console.log('  • 10 Realistic Candidates across all 6 Kanban stages');
console.log('  • AI Assessment for David Kim (Score 88/100)');
