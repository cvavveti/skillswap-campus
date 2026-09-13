export type SupabaseClientLike = any;

declare global {
  interface Window {
    supabase?: {
      createClient: (url: string, key: string) => SupabaseClientLike;
    };
  }
}

let client: SupabaseClientLike | null = null;

export function getSupabase(): SupabaseClientLike {
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

  if (!url || !key) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in Vercel.');
  }
  if (!window.supabase) {
    throw new Error('Supabase client failed to load. Refresh the page and try again.');
  }

  client = window.supabase.createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return client;
}
