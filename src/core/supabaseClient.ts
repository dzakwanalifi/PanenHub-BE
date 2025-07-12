import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Service Role Key must be provided.');
}

// Buat satu instance client Supabase untuk digunakan di seluruh backend
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Penting untuk backend: nonaktifkan auto-refresh token
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log('Supabase client initialized.'); 