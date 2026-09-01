import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db';
import crypto from 'crypto';
import { isSupabaseEnabled } from '../supabaseClient';
import * as supaDb from '../supabaseDb';

const router = Router();

// Middleware helper to check admin role
async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized. Admin credentials required.' });
  }

  if (isSupabaseEnabled) {
    try {
      const role = await supaDb.getUserRole(userId);
      if (!role || role.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden. Admin privileges required.' });
      }
      return next();
    } catch (err) {
      console.error('Error checking admin role:', err);
      return res.status(500).json({ error: 'Failed to verify admin role' });
    }
  }

  const role = db.getUserRole(userId);
  if (!role || role.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. Admin privileges required.' });
  }

  next();
}

// POST /api/admin/create-customer
router.post('/create-customer', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, contact_name, contact_email, password } = req.body;

    if (!name || !contact_name || !contact_email) {
      return res.status(400).json({ error: 'Company name, contact name, and contact email are required.' });
    }

    // Check if user already exists
    if (db.findUserByEmail(contact_email)) {
      return res.status(400).json({ error: 'A user with this contact email already exists.' });
    }

    // 1. Create Customer
    if (isSupabaseEnabled) {
      const customerPayload = {
        name,
        contact_name,
        contact_email,
        created_at: new Date().toISOString(),
      };
      const customer = await supaDb.createCustomer(customerPayload);

      // 2. Create Auth User via Supabase Auth (service role)
      const userPass = password || 'Password123!';
      const svc = require('../supabaseClient').getServiceRoleClient();
      const { data: userData, error: userError } = await svc.auth.admin.createUser({ email: contact_email, password: userPass });
      if (userError) throw userError;

      // 3. Create Profile linked to customer
      const profile = await supaDb.createProfile({ id: userData.id, full_name: contact_name, email: contact_email, customer_id: customer.id, created_at: new Date().toISOString() });

      // 4. Assign 'customer' role
      const role = await supaDb.createUserRole({ user_id: userData.id, role: 'customer', created_at: new Date().toISOString() });

      return res.status(201).json({
        success: true,
        message: 'Customer account created successfully',
        customer,
        user: {
          id: userData.id,
          email: userData.email,
          full_name: profile.full_name,
          role: role.role,
        },
      });
    }

    const customerId = 'c' + crypto.randomUUID().substring(1);
    const customer = db.createCustomer({ id: customerId, name, contact_name, contact_email, created_at: new Date().toISOString() });
    const userPass = password || 'Password123!';
    const authUser = db.createAuthUser(contact_email, userPass);
    const profile = db.createProfile({ id: authUser.id, full_name: contact_name, email: contact_email, customer_id: customerId, created_at: new Date().toISOString() });
    const role = db.createUserRole({ id: 'r' + crypto.randomUUID().substring(1), user_id: authUser.id, role: 'customer', created_at: new Date().toISOString() });

    return res.status(201).json({
      success: true,
      message: 'Customer account created successfully',
      customer,
      user: {
        id: authUser.id,
        email: authUser.email,
        full_name: profile.full_name,
        role: role.role,
      },
    });
  } catch (err: any) {
    console.error('Error creating customer:', err);
    return res.status(500).json({ error: err.message || 'Failed to create customer account' });
  }
});

// POST /api/admin/create-admin
router.post('/create-admin', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { full_name, email, password } = req.body;

    if (!full_name || !email) {
      return res.status(400).json({ error: 'Full name and email are required.' });
    }

    if (isSupabaseEnabled) {
      // create via Supabase Auth + profiles + role
      const svc = require('../supabaseClient').getServiceRoleClient();
      const userPass = password || 'Password123!';
      const { data: userData, error: userError } = await svc.auth.admin.createUser({ email, password: userPass });
      if (userError) throw userError;

      const profile = await supaDb.createProfile({ id: userData.id, full_name, email, customer_id: null, created_at: new Date().toISOString() });
      const role = await supaDb.createUserRole({ user_id: userData.id, role: 'admin', created_at: new Date().toISOString() });

      return res.status(201).json({ success: true, message: 'Admin account created successfully', user: { id: userData.id, email: userData.email, full_name: profile.full_name, role: role.role } });
    }

    if (db.findUserByEmail(email)) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    const userPass = password || 'Password123!';
    const authUser = db.createAuthUser(email, userPass);
    const profile = db.createProfile({ id: authUser.id, full_name, email, customer_id: null, created_at: new Date().toISOString() });
    const role = db.createUserRole({ id: 'r' + crypto.randomUUID().substring(1), user_id: authUser.id, role: 'admin', created_at: new Date().toISOString() });

    return res.status(201).json({ success: true, message: 'Admin account created successfully', user: { id: authUser.id, email: authUser.email, full_name: profile.full_name, role: role.role } });
  } catch (err: any) {
    console.error('Error creating admin:', err);
    return res.status(500).json({ error: err.message || 'Failed to create admin account' });
  }
});

// GET /api/admin/customers
router.get('/customers', requireAdmin, (_req: Request, res: Response) => {
  try {
    const customers = db.getCustomers();
    const jobs = db.getJobs();
    const candidates = db.getCandidates();

    const result = customers.map(c => {
      const customerJobs = jobs.filter(j => j.customer_id === c.id);
      const customerCandidates = candidates.filter(cand => cand.customer_id === c.id);
      return {
        ...c,
        jobs_count: customerJobs.length,
        active_jobs_count: customerJobs.filter(j => j.status === 'Open').length,
        candidates_count: customerCandidates.length,
      };
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch customers' });
  }
});

export default router;
