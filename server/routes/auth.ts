import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // In demo environment, verify matching password
    if (user.passwordHash !== password) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const profile = db.getProfile(user.id);
    const roleRecord = db.getUserRole(user.id);
    const customer = profile?.customer_id ? db.getCustomer(profile.customer_id) : null;

    // Create session token
    const token = Buffer.from(`${user.id}:${user.email}:${roleRecord?.role || 'customer'}:${Date.now()}`).toString('base64');

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: profile?.full_name || user.email,
        customer_id: profile?.customer_id || null,
        role: roleRecord?.role || 'customer',
        customer: customer || null,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: err.message || 'Login failed.' });
  }
});

// GET /api/auth/session
router.get('/session', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'No active session' });
    }

    const user = db.findUserById(userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const profile = db.getProfile(user.id);
    const roleRecord = db.getUserRole(user.id);
    const customer = profile?.customer_id ? db.getCustomer(profile.customer_id) : null;

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: profile?.full_name || user.email,
        customer_id: profile?.customer_id || null,
        role: roleRecord?.role || 'customer',
        customer: customer || null,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Session error' });
  }
});

// POST /api/auth/reset-demo
router.post('/reset-demo', (_req: Request, res: Response) => {
  db.resetToSeed();
  return res.json({ success: true, message: 'Database reset to initial seed state.' });
});

export default router;
