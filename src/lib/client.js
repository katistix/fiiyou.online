import { createClient } from '@supabase/supabase-js';

// Vite exposes import.meta.env; fall back to process.env for node scripts.
const env = import.meta.env ?? process.env;

/** True when the build has no Supabase settings. main.jsx then shows a clear setup message instead of a blank page. */
export const configMissing = !/^https?:\/\//.test(env.VITE_SUPABASE_URL || '') || !env.VITE_SUPABASE_ANON_KEY;

// createClient throws on an empty URL, which would blank the whole page before React can render anything.
export const supabase = createClient(configMissing ? 'http://localhost:54321' : env.VITE_SUPABASE_URL, configMissing ? 'missing' : env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

/** Throws on error, returns data otherwise. Every api function uses this. */
export function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

/** Postgres/RPC error messages we raise on purpose -> stable codes for the UI. */
export function errorCode(err) {
  const m = (err?.message ?? '').toLowerCase();
  for (const c of ['rate_limit', 'card_limit', 'not_authenticated', 'not_found', 'cannot_friend_self',
                   'too_many', 'duplicates', 'not_friends', 'bad_layout']) {
    if (m.includes(c)) return c;
  }
  if (err?.code === '23505') return 'duplicate';
  if (err?.code === '23514') return 'invalid_value';     // CHECK constraint (theme, card content, lengths)
  if (err?.code === '42501') return 'forbidden';         // RLS
  return 'unknown';
}

export const PROFILE_PUBLIC = 'id, username, display_name, avatar_path, locality_id';
