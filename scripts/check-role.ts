import dotenv from 'dotenv';
import { getServiceRoleClient } from '../server/supabaseClient';

dotenv.config();

(async () => {
  try {
    const svc = getServiceRoleClient();
    const userId = process.argv[2] || '851a0b03-bf15-475d-a121-874186ed704c';
    const { data, error } = await svc.from('user_roles').select('*').eq('user_id', userId);
    console.log('RESULT', { data, error });
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
})();
