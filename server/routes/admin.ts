import { Router, Request, Response } from 'express';
import { db } from '../db';
import crypto from 'crypto';

const router = Router();

// Middleware helper to check admin role
function requireAdmin(req: Request, res: Response, next: () => void) {
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized. Admin credentials required.' });
  }

  const role = db.getUserRole(userId);
  if (!role || role.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. Admin privileges required.' });
  }

  next();
}

// POST /api/admin/create-customer
router.post('/create-customer', requireAdmin, (req: Request, res: Response) => {
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
    const customerId = 'c' + crypto.randomUUID().substring(1);
    const customer = db.createCustomer({
      id: customerId,
      name,
      contact_name,
      contact_email,
      created_at: new Date().toISOString(),
    });

    // 2. Create Auth User
    const userPass = password || 'Password123!';
    const authUser = db.createAuthUser(contact_email, userPass);

    // 3. Create Profile linked to customer
    const profile = db.createProfile({
      id: authUser.id,
      full_name: contact_name,
      email: contact_email,
      customer_id: customerId,
      created_at: new Date().toISOString(),
    });

    // 4. Assign 'customer' role
    const role = db.createUserRole({
      id: 'r' + crypto.randomUUID().substring(1),
      user_id: authUser.id,
      role: 'customer',
      created_at: new Date().toISOString(),
    });

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
router.post('/create-admin', requireAdmin, (req: Request, res: Response) => {
  try {
    const { full_name, email, password } = req.body;

    if (!full_name || !email) {
      return res.status(400).json({ error: 'Full name and email are required.' });
    }

    if (db.findUserByEmail(email)) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    // 1. Create Auth User
    const userPass = password || 'Password123!';
    const authUser = db.createAuthUser(email, userPass);

    // 2. Create Profile (customer_id is null for admins)
    const profile = db.createProfile({
      id: authUser.id,
      full_name,
      email,
      customer_id: null,
      created_at: new Date().toISOString(),
    });

    // 3. Assign 'admin' role
    const role = db.createUserRole({
      id: 'r' + crypto.randomUUID().substring(1),
      user_id: authUser.id,
      role: 'admin',
      created_at: new Date().toISOString(),
    });

    return res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      user: {
        id: authUser.id,
        email: authUser.email,
        full_name: profile.full_name,
        role: role.role,
      },
    });
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
