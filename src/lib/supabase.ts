import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_STORAGE_KEYS = {
  URL: 'simutimer_supabase_url',
  ANON_KEY: 'simutimer_supabase_anon_key',
};

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = localStorage.getItem(SUPABASE_STORAGE_KEYS.URL) || '';
  const storedKey = localStorage.getItem(SUPABASE_STORAGE_KEYS.ANON_KEY) || '';

  return {
    url: (storedUrl || envUrl).trim(),
    anonKey: (storedKey || envKey).trim(),
  };
}

export function saveSupabaseCredentials(url: string, anonKey: string) {
  if (url.trim()) {
    localStorage.setItem(SUPABASE_STORAGE_KEYS.URL, url.trim());
  } else {
    localStorage.removeItem(SUPABASE_STORAGE_KEYS.URL);
  }

  if (anonKey.trim()) {
    localStorage.setItem(SUPABASE_STORAGE_KEYS.ANON_KEY, anonKey.trim());
  } else {
    localStorage.removeItem(SUPABASE_STORAGE_KEYS.ANON_KEY);
  }

  // Re-instantiate client
  cachedClient = null;
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const { url, anonKey } = getSupabaseCredentials();
  if (url && anonKey && url.startsWith('http')) {
    try {
      cachedClient = createClient(url, anonKey, {
        auth: { persistSession: false },
        realtime: { params: { eventsPerSecond: 10 } },
      });
      return cachedClient;
    } catch (e) {
      console.error('Error creating Supabase client:', e);
      return null;
    }
  }

  return null;
}
