// Shared auth helper: reads session from localStorage, auto-refreshes the
// access_token when it is near expiry so long-lived pages (jury review,
// admin dashboard, submission uploads) don't fail with "JWT expired" / 401.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const REFRESH_WINDOW_SEC = 5 * 60; // refresh if token expires within 5 minutes

export interface Session {
  uid?: string;
  email?: string;
  name?: string;
  token?: string;
}

function storageKey(): string {
  const ref = supabaseUrl.replace("https://", "").split(".")[0];
  return `sb-${ref}-auth-token`;
}

function readRaw(): any | null {
  try {
    const stored = localStorage.getItem(storageKey());
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function writeRaw(obj: any) {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(obj));
  } catch {
    // ignore storage errors
  }
}

function decodeExp(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp : 0;
  } catch {
    return 0;
  }
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshToken(refreshTokenValue: string): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
        },
        body: JSON.stringify({ refresh_token: refreshTokenValue }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const existing = readRaw() || {};
      const merged = {
        ...existing,
        access_token: data.access_token,
        refresh_token: data.refresh_token ?? existing.refresh_token,
        expires_at: data.expires_at,
        expires_in: data.expires_in,
        token_type: data.token_type,
        user: data.user ?? existing.user,
      };
      writeRaw(merged);
      return data.access_token as string;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

/**
 * Returns the current session with a guaranteed-fresh access_token.
 * Automatically refreshes if the token is expired or near expiry.
 */
export async function getSession(): Promise<Session> {
  const raw = readRaw();
  if (!raw) return {};

  const user = raw.user;
  const uid = user?.id;
  const email = user?.email;
  const name = user?.user_metadata?.full_name || email?.split("@")[0];
  let token: string | undefined = raw.access_token;

  if (token) {
    const exp = decodeExp(token);
    const nowSec = Math.floor(Date.now() / 1000);
    if (exp && exp - nowSec < REFRESH_WINDOW_SEC && raw.refresh_token) {
      const newToken = await refreshToken(raw.refresh_token);
      if (newToken) token = newToken;
    }
  }

  return { uid, email, name, token };
}

/** Synchronous read — kept for places that genuinely cannot await. */
export function readSessionSync(): Session {
  const raw = readRaw();
  if (!raw) return {};
  const user = raw.user;
  return {
    uid: user?.id,
    email: user?.email,
    name: user?.user_metadata?.full_name || user?.email?.split("@")[0],
    token: raw.access_token,
  };
}
