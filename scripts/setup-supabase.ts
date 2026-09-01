import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Client } from 'pg';
import { execSync } from 'child_process';

dotenv.config();

async function run() {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error('SUPABASE_DB_URL is not set. Obtain the database connection string from your Supabase project settings and add it to your .env as SUPABASE_DB_URL');
    process.exit(1);
  }

  const schemaPath = path.resolve(process.cwd(), 'supabase', 'schema.sql');
  const seedPath = path.resolve(process.cwd(), 'supabase', 'seed.sql');

  if (!fs.existsSync(schemaPath)) {
    console.error('Schema file not found:', schemaPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf-8');

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } as any });
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Applying schema SQL...');
    await client.query(sql);
    console.log('Schema applied successfully.');

    if (fs.existsSync(seedPath)) {
      console.log('Applying seed SQL...');
      const seedSql = fs.readFileSync(seedPath, 'utf-8');
      await client.query(seedSql);
      console.log('Seed SQL applied successfully.');
    } else {
      console.log('No seed.sql found; skipping seed SQL.');
    }

    // Optionally run service-role seeding which creates auth users
    if (process.env.RUN_DB_SEED === 'true') {
      console.log('Running npm run db:seed (service-role seeding)...');
      execSync('npm run db:seed', { stdio: 'inherit' });
    }
  } catch (err: any) {
    console.error('Failed to apply schema/seed:', err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }

  console.log('\n✅ Supabase schema (and optional seed) applied.');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
