// Public (people's choice) vote service.
// Separate from jury voteService; writes to public_votes table.
// One vote per logged-in user per submission; toggle via vote()/unvote().

import { getSession } from "./authToken";

export interface PublicVote {
  id: string;
  submission_id: string;
  voter_uid: string;
  voter_email: string | null;
  created_at: string;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const PUBLIC_VOTE_DEADLINE_UTC = "2026-10-19T23:59:00Z";

export function isPublicVoteOpen(): boolean {
  return Date.now() < new Date(PUBLIC_VOTE_DEADLINE_UTC).getTime();
}

export const publicVoteService = {
  async vote(submissionId: string): Promise<void> {
    const { uid, email, token } = await getSession();
    if (!uid || !token) throw new Error("Please log in to vote.");

    const response = await fetch(
      `${supabaseUrl}/rest/v1/public_votes?apikey=${encodeURIComponent(anonKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Prefer: "return=minimal,resolution=ignore-duplicates",
        },
        body: JSON.stringify({
          submission_id: submissionId,
          voter_uid: uid,
          voter_email: email,
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      if (response.status === 409) return;
      throw new Error(`Vote failed (${response.status}): ${text}`);
    }
  },

  async unvote(submissionId: string): Promise<void> {
    const { uid, token } = await getSession();
    if (!uid || !token) throw new Error("Please log in to vote.");

    const response = await fetch(
      `${supabaseUrl}/rest/v1/public_votes?submission_id=eq.${encodeURIComponent(submissionId)}&voter_uid=eq.${encodeURIComponent(uid)}&apikey=${encodeURIComponent(anonKey)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Unvote failed (${response.status}): ${text}`);
    }
  },

  /** Submission IDs the current user has voted for. */
  async getMyVotes(): Promise<Set<string>> {
    const { uid, token } = await getSession();
    if (!uid || !token) return new Set();

    const response = await fetch(
      `${supabaseUrl}/rest/v1/public_votes?voter_uid=eq.${encodeURIComponent(uid)}&select=submission_id&apikey=${encodeURIComponent(anonKey)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) return new Set();
    const rows = await response.json();
    return new Set((rows as { submission_id: string }[]).map((r) => r.submission_id));
  },

  /** Public vote counts for all shortlisted submissions. Returns Map(submission_id -> count).
   *  Paginates through ALL rows — the PostgREST default limit of 1000 would otherwise
   *  cause projects to show fluctuating / under-counted vote totals once the total
   *  number of votes crosses that threshold. */
  async getAllCounts(): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    const PAGE = 1000;
    let offset = 0;
    while (true) {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/public_votes?select=submission_id&order=created_at.asc&apikey=${encodeURIComponent(anonKey)}`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            Range: `${offset}-${offset + PAGE - 1}`,
            "Range-Unit": "items",
            Prefer: "count=exact",
          },
        }
      );
      if (!response.ok) break;
      const rows = (await response.json()) as { submission_id: string }[];
      for (const r of rows) {
        counts.set(r.submission_id, (counts.get(r.submission_id) ?? 0) + 1);
      }
      if (rows.length < PAGE) break;
      offset += PAGE;
      if (offset > 100000) break; // safety guard
    }
    return counts;
  },
};
