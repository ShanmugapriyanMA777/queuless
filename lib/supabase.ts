
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ssyohcnmnveuasfyqbpu.supabase.co';
const supabaseAnonKey = 'sb_publishable_poULeZOaQ_IKWmHvLPkbvQ_aCu_qZaz';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
