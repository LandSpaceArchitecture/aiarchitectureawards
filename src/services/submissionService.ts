import { supabase } from "@/src/supabase";
import { Submission, SubmissionStatus } from "@/src/types";
export type { Submission, SubmissionStatus };

const SUBMISSIONS_TABLE = "submissions";
const SUBMISSIONS_BUCKET = "submissions";

export const submissionService = {
  async createSubmission(
    data: Omit<Submission, "id" | "created_at" | "submission_status" | "payment_status" | "is_featured">,
    uid?: string
  ) {
    console.log("[submissionService] createSubmission called");
    let userId = uid;
    let accessToken: string | undefined;

    // Read auth token directly from localStorage (never calls supabase.auth — avoids hangs)
    try {
      const url = import.meta.env.VITE_SUPABASE_URL as string;
      const ref = url.replace('https://', '').split('.')[0];
      const stored = localStorage.getItem(`sb-${ref}-auth-token`);
      if (stored) {
        const parsed = JSON.parse(stored);
        accessToken = parsed?.access_token;
        userId = userId || parsed?.user?.id;
        console.log("[submissionService] Got token from localStorage, user:", userId);
      } else {
        console.warn("[submissionService] No auth token in localStorage");
      }
    } catch (e) {
      console.warn('[submissionService] Could not read auth token from localStorage:', e);
    }

    if (!userId) throw new Error("User must be authenticated to submit.");
    if (!accessToken) throw new Error("No auth token found. Please log in again.");

    const submissionData = {
      ...data,
      uid: userId,
      submission_status: "submitted",
      payment_status: "completed",
      is_featured: false,
    };

    console.log("[submissionService] Inserting submission via direct REST for user:", userId);

    // Direct REST call — bypasses the JS client (which can hang after Stripe redirect)
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const response = await fetch(`${supabaseUrl}/rest/v1/${SUBMISSIONS_TABLE}`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(submissionData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[submissionService] Insert failed:', response.status, errorText);
      throw new Error(`Insert failed (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('[submissionService] Insert success:', result);
    return Array.isArray(result) ? result[0]?.id : result?.id;
  },

  async uploadProjectImages(files: File[], projectTitle: string, onProgress?: (progress: number) => void): Promise<string[]> {
    // Read auth directly from localStorage (avoid getSession which can hang)
    let userId: string | undefined;
    let accessToken: string | undefined;
    try {
      const url = import.meta.env.VITE_SUPABASE_URL as string;
      const ref = url.replace('https://', '').split('.')[0];
      const stored = localStorage.getItem(`sb-${ref}-auth-token`);
      if (stored) {
        const parsed = JSON.parse(stored);
        accessToken = parsed?.access_token;
        userId = parsed?.user?.id;
      }
    } catch (e) {
      console.warn('[submissionService] Failed to read localStorage auth:', e);
    }
    if (!userId || !accessToken) throw new Error("User must be authenticated to upload.");
    const user = { id: userId };
    
    console.time("UploadAllImages");
    const totalFiles = files.length;
    let completedFiles = 0;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

    const uploadPromises = files.map(async (file) => {
      const timestamp = Date.now();
      const sanitizedTitle = projectTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `${timestamp}-${file.name.replace(/[^a-z0-9.]/gi, '_')}`;
      const path = `${user.id}/${sanitizedTitle}/${fileName}`;

      // Direct REST upload — bypasses the JS client to avoid hangs
      const uploadResponse = await fetch(
        `${supabaseUrl}/storage/v1/object/${SUBMISSIONS_BUCKET}/${path}`,
        {
          method: 'POST',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': file.type || 'application/octet-stream',
            'Cache-Control': '3600',
            'x-upsert': 'false',
          },
          body: file,
        }
      );

      if (!uploadResponse.ok) {
        const errText = await uploadResponse.text();
        console.error('Storage upload failed:', uploadResponse.status, errText);
        throw new Error(`Upload failed (${uploadResponse.status}): ${errText}`);
      }

      completedFiles++;
      if (onProgress) onProgress((completedFiles / totalFiles) * 100);

      return `${supabaseUrl}/storage/v1/object/public/${SUBMISSIONS_BUCKET}/${path}`;
    });

    const urls = await Promise.all(uploadPromises);
    console.timeEnd("UploadAllImages");
    return urls;
  },

  async getSubmissionById(id: string): Promise<Submission | null> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/${SUBMISSIONS_TABLE}?id=eq.${encodeURIComponent(id)}&select=*&apikey=${encodeURIComponent(anonKey)}`,
        { headers: { 'Accept': 'application/json' } }
      );
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
      const rows = await response.json();
      return (Array.isArray(rows) && rows[0]) ? (rows[0] as Submission) : null;
    } catch (error) {
      console.error('Error in getSubmissionById:', error);
      return null;
    }
  },

  async getSubmissions(category?: string, status?: string) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    try {
      const params = new URLSearchParams();
      params.set('select', '*');
      params.set('order', 'created_at.desc');
      params.set('apikey', anonKey);
      if (category && category !== 'all') {
        params.set('category', `cs.{${category}}`); // contains
      }
      if (status && status !== 'all') {
        params.set('submission_status', `eq.${status}`);
      }
      const response = await fetch(
        `${supabaseUrl}/rest/v1/${SUBMISSIONS_TABLE}?${params.toString()}`,
        { headers: { 'Accept': 'application/json' } }
      );
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
      const data = await response.json();
      return data as Submission[];
    } catch (error) {
      console.error('Error in getSubmissions:', error);
      return [];
    }
  },

  subscribeToSubmissions(callback: (submissions: Submission[]) => void, category?: string, status?: string) {
    // Initial fetch
    this.getSubmissions(category, status).then(callback);
    // Poll every 30s (realtime channel removed because JS client can hang)
    const interval = setInterval(() => {
      this.getSubmissions(category, status).then(callback);
    }, 30000);
    return () => clearInterval(interval);
  },

  async updateSubmissionStatus(id: string, status: SubmissionStatus) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    // Need authed token to pass RLS
    let accessToken: string | undefined;
    try {
      const ref = supabaseUrl.replace('https://', '').split('.')[0];
      const stored = localStorage.getItem(`sb-${ref}-auth-token`);
      if (stored) accessToken = JSON.parse(stored)?.access_token;
    } catch {}
    if (!accessToken) throw new Error("Not authenticated");

    const response = await fetch(
      `${supabaseUrl}/rest/v1/${SUBMISSIONS_TABLE}?id=eq.${encodeURIComponent(id)}&apikey=${encodeURIComponent(anonKey)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ submission_status: status }),
      }
    );
    if (!response.ok) {
      const text = await response.text();
      console.error('updateSubmissionStatus failed:', response.status, text);
      throw new Error(`Update failed (${response.status}): ${text}`);
    }
  },

  async updateSubmission(id: string, data: Partial<Submission>) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    let accessToken: string | undefined;
    try {
      const ref = supabaseUrl.replace('https://', '').split('.')[0];
      const stored = localStorage.getItem(`sb-${ref}-auth-token`);
      if (stored) accessToken = JSON.parse(stored)?.access_token;
    } catch {}
    if (!accessToken) throw new Error("Not authenticated");

    const response = await fetch(
      `${supabaseUrl}/rest/v1/${SUBMISSIONS_TABLE}?id=eq.${encodeURIComponent(id)}&apikey=${encodeURIComponent(anonKey)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(data),
      }
    );
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Update failed (${response.status}): ${text}`);
    }
  },

  async deleteSubmission(id: string) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    let accessToken: string | undefined;
    try {
      const ref = supabaseUrl.replace('https://', '').split('.')[0];
      const stored = localStorage.getItem(`sb-${ref}-auth-token`);
      if (stored) accessToken = JSON.parse(stored)?.access_token;
    } catch {}
    if (!accessToken) throw new Error("Not authenticated");

    const response = await fetch(
      `${supabaseUrl}/rest/v1/${SUBMISSIONS_TABLE}?id=eq.${encodeURIComponent(id)}&apikey=${encodeURIComponent(anonKey)}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      }
    );
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Delete failed (${response.status}): ${text}`);
    }
  }
};
