import { Router, Request, Response } from 'express';
// import { db } from '../db';
import { isSupabaseEnabled, getSupabase, getServiceRoleClient } from '../supabaseClient';

const router = Router();

// we load db only when needed.
const getLocalDb = async () => {
  const { db } = await import('../db');
  return db;
};

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (isSupabaseEnabled) {
      // Use anon client to sign in with password
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data?.user) {
        console.warn('Supabase signInWithPassword failed:', { error: error ? error.message : null, data });

        // If the failure is due to unconfirmed email and demo auto-confirm is allowed,
        // attempt to auto-confirm. This is strictly a demo convenience and MUST be
        // disabled in production by leaving ALLOW_DEMO_AUTO_CONFIRM unset or false.
        const allowAutoConfirm = String(process.env.ALLOW_DEMO_AUTO_CONFIRM || '').toLowerCase() === 'true';
        const errMsg = error?.message || '';
        if (allowAutoConfirm && (errMsg.toLowerCase().includes('email not confirmed') || errMsg.toLowerCase().includes('not confirmed'))) {
          try {
            // Find user id by email via admin REST
            const url = `${process.env.SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`;
            const resp = await fetch(url, { headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || '' } });
            const j = await resp.json().catch(() => null);
            console.warn('Admin users lookup response:', { ok: resp.ok, status: resp.status, body: j });
            if (resp.ok && j) {
              let found: any = null;
              if (Array.isArray(j?.users)) found = j.users.find((u: any) => u.email === email) || j.users[0];
              else if (Array.isArray(j)) found = j.find((u: any) => u.email === email) || j[0];
              else found = j;
              const userId = found?.id;
              if (userId) {
                // Attempt to mark email as confirmed
                const updateUrl = `${process.env.SUPABASE_URL}/auth/v1/admin/users/${userId}`;
                await fetch(updateUrl, {
                  method: 'PUT',
                  headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || '', 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email_confirm: true, email_confirmed_at: new Date().toISOString() }),
                });

                // Retry sign in once
                const retry = await supabase.auth.signInWithPassword({ email, password });
                if (!retry.error && retry.data?.user) {
                  // proceed with retry result
                  const userId = retry.data.user.id;
                  const svc = getServiceRoleClient();
                  const { data: profileData } = await svc.from('profiles').select('*').eq('id', userId).maybeSingle();
                  const { data: roleData } = await svc.from('user_roles').select('*').eq('user_id', userId).maybeSingle();
                  const profile = profileData || null;
                  const roleRecord = roleData || null;
                  const customer = profile?.customer_id ? (await svc.from('customers').select('*').eq('id', profile.customer_id).maybeSingle()).data : null;

                  const token = Buffer.from(`${userId}:${email}:${roleRecord?.role || 'customer'}:${Date.now()}`).toString('base64');
                  return res.json({ token, user: { id: userId, email, full_name: profile?.full_name || email, customer_id: profile?.customer_id || null, role: roleRecord?.role || 'customer', customer: customer || null } });
                }
              }
            }
          } catch (e) {
            console.warn('Auto-confirm attempt failed:', e);
          }
        }

        if (!allowAutoConfirm && errMsg.toLowerCase().includes('email not confirmed')) {
          console.warn('Login failed due to unconfirmed email; ALLOW_DEMO_AUTO_CONFIRM is not enabled.');
        }

        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const userId = data.user.id;
      // Fetch profile and role via service role client
      const svc = getServiceRoleClient();
      const { data: profileData, error: profileErr } = await svc.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (profileErr) console.warn('Profile lookup error:', profileErr.message);
      const { data: roleData, error: roleErr } = await svc.from('user_roles').select('*').eq('user_id', userId).maybeSingle();
      if (roleErr) console.warn('Role lookup error:', roleErr.message);

      const profile = profileData || null;
      const roleRecord = roleData || null;
      const customer = profile?.customer_id ? (await svc.from('customers').select('*').eq('id', profile.customer_id).maybeSingle()).data : null;

      const token = Buffer.from(`${userId}:${email}:${roleRecord?.role || 'customer'}:${Date.now()}`).toString('base64');

      return res.json({
        token,
        user: {
          id: userId,
          email,
          full_name: profile?.full_name || email,
          customer_id: profile?.customer_id || null,
          role: roleRecord?.role || 'customer',
          customer: customer || null,
        },
      });
    }

    // Local JSON fallback (demo)
    // const user = db.findUserByEmail(email);
    const db = await getLocalDb();
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
router.get('/session', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'No active session' });
    }

    if (isSupabaseEnabled) {
      const svc = getServiceRoleClient();
      const { data: profileData, error: profileErr } = await svc.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (profileErr) console.warn('Session profile lookup error:', profileErr.message);
      const { data: roleData, error: roleErr } = await svc.from('user_roles').select('*').eq('user_id', userId).maybeSingle();
      if (roleErr) console.warn('Session role lookup error:', roleErr.message);

      const profile = profileData || null;
      const roleRecord = roleData || null;
      const customer = profile?.customer_id ? (await svc.from('customers').select('*').eq('id', profile.customer_id).maybeSingle()).data : null;

      return res.json({
        user: {
          id: userId,
          email: profile?.email || null,
          full_name: profile?.full_name || null,
          customer_id: profile?.customer_id || null,
          role: roleRecord?.role || 'customer',
          customer: customer || null,
        },
      });
    }

    // const user = db.findUserById(userId);
    // if (!user) {
    //   return res.status(401).json({ error: 'User not found' });
    // }

    const db = await getLocalDb();

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
// router.post('/reset-demo', (_req: Request, res: Response) => {
//   db.resetToSeed();
//   return res.json({ success: true, message: 'Database reset to initial seed state.' });
// });

router.post('/reset-demo', async (_req: Request, res: Response) => {
  const db = await getLocalDb();
  db.resetToSeed();
  return res.json({ success: true, message: 'Database reset to initial seed state.' });
});

export default router;
