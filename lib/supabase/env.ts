/**
 * Supabase project credentials.
 *
 * The current Supabase dashboard calls this value the "publishable" key while
 * older projects (and the docs) still use "anon" - accept either name so the
 * app keeps working whichever label you copy.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseKey);
