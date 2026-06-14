// Vote service — uses direct fetch to bypass the JS client which hangs after auth changes.

export interface Vote {
  id: string;
  submission_id: string;
  voter_uid: string;
  voter_email: string | null;
  voter_name: string | null;
  created_at: string;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

function readAuth(): { uid?: string; email?: string; name?: string; token?: string } {
  try {
    const ref = supabaseUrl.replace('https://', '').split('.')[0];
    const stored = localStorage.getItem(`sb-${ref}-auth-token`);
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    return {
      uid: parsed?.user?.id,
      email: parsed?.user?.email,
      name: parsed?.user?.user_metadata?.full_name || parsed?.user?.email?.split('@')[0],
      token: parsed?.access_token,
    };
  } catch {
    return {};
  }
}

export const voteService = {
  /** Cast a vote for a submission (no-op if already voted). */
  async vote(submissionId: string): Promise<void> {
    const { uid, email, name, token } = readAuth();
    if (!uid || !token) throw new Error('Not authenticated');

    const response = await fetch(
      `${supabaseUrl}/rest/v1/votes?apikey=${encodeURIComponent(anonKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Prefer': 'return=minimal,resolution=ignore-duplicates',
        },
        body: JSON.stringify({
          submission_id: submissionId,
          voter_uid: uid,
          voter_email: email,
          voter_name: name,
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      // Duplicate vote (409) is fine — treat as success
      if (response.status === 409) return;
      throw new Error(`Vote failed (${response.status}): ${text}`);
    }
  },

  /** Remove the current user's vote for this submission. */
  async unvote(submissionId: string): Promise<void> {
    const { uid, token } = readAuth();
    if (!uid || !token) throw new Error('Not authenticated');

    const response = await fetch(
      `${supabaseUrl}/rest/v1/votes?submission_id=eq.${encodeURIComponent(submissionId)}&voter_uid=eq.${encodeURIComponent(uid)}&apikey=${encodeURIComponent(anonKey)}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Unvote failed (${response.status}): ${text}`);
    }
  },

  /** Get all votes the current user has cast (returns submission_ids). */
  async getMyVotes(): Promise<Set<string>> {
    const { uid, token } = readAuth();
    if (!uid || !token) return new Set();

    const response = await fetch(
      `${supabaseUrl}/rest/v1/votes?voter_uid=eq.${encodeURIComponent(uid)}&select=submission_id&apikey=${encodeURIComponent(anonKey)}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (!response.ok) return new Set();
    const rows = await response.json();
    return new Set((rows as { submission_id: string }[]).map(r => r.submission_id));
  },

  /** Get count of votes for a single submission (any jury can call). */
  async getCount(submissionId: string): Promise<number> {
    const { token } = readAuth();
    if (!token) return 0;

    const response = await fetch(
      `${supabaseUrl}/rest/v1/votes?submission_id=eq.${encodeURIComponent(submissionId)}&select=*&apikey=${encodeURIComponent(anonKey)}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Prefer': 'count=exact',
          'Range': '0-0',
        },
      }
    );

    if (!response.ok) return 0;
    const contentRange = response.headers.get('content-range');
    if (contentRange) {
      const total = contentRange.split('/')[1];
      return parseInt(total, 10) || 0;
    }
    const rows = await response.json();
    return Array.isArray(rows) ? rows.length : 0;
  },

  /** Admin: get ALL votes with voter info — grouped by submission_id. */
  async getAllVotes(): Promise<Vote[]> {
    const { token } = readAuth();
    if (!token) return [];

    const response = await fetch(
      `${supabaseUrl}/rest/v1/votes?select=*&order=created_at.desc&apikey=${encodeURIComponent(anonKey)}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (!response.ok) return [];
    return (await response.json()) as Vote[];
  },
};
