import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: false, // disabled: refresh calls have been hanging in this project
    detectSessionInUrl: true,
  },
});

export const loginWithGoogle = async (redirectPath?: string) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectPath ? `${window.location.origin}${redirectPath}` : window.location.origin
    }
  });
  if (error) throw error;
  return data;
};

export const logout = async () => {
  // Clear localStorage session (the source of truth in this project)
  try {
    const ref = supabaseUrl.replace('https://', '').split('.')[0];
    localStorage.removeItem(`sb-${ref}-auth-token`);
    // Clear any other supabase-related keys
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith('sb-')) localStorage.removeItem(k);
    });
  } catch (e) {
    console.warn('Could not clear localStorage on logout:', e);
  }

  // Fire-and-forget: tell supabase server to invalidate the token (don't wait — JS client can hang)
  supabase.auth.signOut().catch(() => {});

  // Force hard reload so AuthContext re-initializes with no session
  window.location.href = '/';
};

// Helper: persist a session into localStorage in the format supabase-js expects
const persistSession = (session: any) => {
  if (!session) return;
  try {
    const ref = supabaseUrl.replace('https://', '').split('.')[0];
    localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
  } catch (e) {
    console.warn('Failed to persist session:', e);
  }
};

export const registerWithEmail = async (email: string, pass: string, name: string) => {
  // Use apikey via URL query param to avoid triggering CORS preflight
  const url = `${supabaseUrl}/auth/v1/signup?apikey=${encodeURIComponent(supabaseAnonKey)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: pass,
      data: { full_name: name },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.msg || data.error_description || data.error || `Sign up failed (${response.status})`);
  }

  // If signup returned a session (auto-confirm on), persist it
  if (data.access_token) {
    persistSession(data);
    // Fire-and-forget: notify the JS client but don't await (avoids hang)
    supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token }).catch(() => {});
  }
  return data;
};

export const loginWithEmail = async (email: string, pass: string) => {
  // Use apikey via URL query param to avoid triggering CORS preflight
  const url = `${supabaseUrl}/auth/v1/token?grant_type=password&apikey=${encodeURIComponent(supabaseAnonKey)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.msg || data.error_description || data.error || `Login failed (${response.status})`);
  }

  persistSession(data);
  supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token }).catch(() => {});
  return data;
};
