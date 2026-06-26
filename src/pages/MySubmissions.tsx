import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Loader2, Calendar, CheckCircle2, Clock, Award, FileText, ExternalLink, LogIn } from "lucide-react";
import { useAuth } from "@/src/contexts/AuthContext";
import { submissionService, Submission } from "@/src/services/submissionService";
import { CATEGORIES } from "@/src/constants";
import { cn } from "@/src/lib/utils";
import { usePageMeta } from "@/src/hooks/usePageMeta";

import { calculateFee, EntrantType } from "@/src/constants";

// Get the fee paid — uses stored fee_paid if available, otherwise recomputes.
function computeFeePaid(submission: Submission): number {
  // Use stored value if it was recorded at submission time (after pricing schema update)
  const stored = (submission as any).fee_paid;
  if (typeof stored === "number" && stored > 0) return stored;

  const categories = submission.category || [];
  if (categories.length === 0) return 0;
  const submittedAt = submission.created_at ? new Date(submission.created_at) : new Date();
  const entrantType: EntrantType = ((submission as any).entrant_type as EntrantType) || "professional";
  return calculateFee(categories, entrantType, submittedAt);
}

export default function MySubmissions() {
  const { user, supabaseUser, loading: authLoading } = useAuth();

  usePageMeta({
    title: "My Submissions",
    description: "View your submitted projects, payment history, and current status.",
    canonicalPath: "/my-submissions",
  });

  const userId = supabaseUser?.id;
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    submissionService.getSubmissions()
      .then(all => {
        const mine = all.filter(s => (s as any).uid === userId);
        setSubmissions(mine);
      })
      .catch(err => console.error("Failed to load submissions:", err))
      .finally(() => setLoading(false));
  }, [userId]);

  if (authLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  if (!user && !supabaseUser) {
    return (
      <div className="mx-auto max-w-md px-4 py-32 text-center">
        <div className="mb-12 flex h-24 w-24 items-center justify-center border border-black mx-auto">
          <LogIn className="h-10 w-10 text-black" />
        </div>
        <h2 className="text-4xl font-bold uppercase tracking-tighter">Sign in required</h2>
        <p className="mt-6 text-gray-500 leading-relaxed">
          Log in with the account you used to submit your project to view your entries.
        </p>
        <Link
          to="/login?redirect=/my-submissions"
          className="mt-12 inline-flex w-full items-center justify-center gap-3 bg-black py-6 text-xs font-bold uppercase tracking-[0.3em] text-white transition-all hover:bg-gray-800"
        >
          <LogIn className="h-4 w-4" />
          <span>Sign In</span>
        </Link>
      </div>
    );
  }

  const totalSpent = submissions.reduce((sum, s) => sum + computeFeePaid(s), 0);

  return (
    <div className="bg-white min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-20">
          <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-black/40 mb-4">
            ACCOUNT / MY ENTRIES
          </div>
          <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-tighter leading-[0.9]">
            My Submissions
          </h1>
          <p className="mt-6 max-w-xl text-base text-black/60 leading-relaxed">
            All projects you have submitted to the 2026 AI Architecture Awards, with payment history.
          </p>

          {/* Stats */}
          {submissions.length > 0 && (
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-px bg-black/10 border border-black/10">
              <div className="bg-white p-8">
                <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-black/40">Entries</div>
                <div className="mt-3 text-5xl font-bold tracking-tighter">{submissions.length}</div>
              </div>
              <div className="bg-white p-8">
                <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-black/40">Total Paid</div>
                <div className="mt-3 text-5xl font-bold tracking-tighter">${totalSpent}</div>
              </div>
              <div className="bg-white p-8 col-span-2 sm:col-span-1">
                <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-black/40">Shortlisted</div>
                <div className="mt-3 text-5xl font-bold tracking-tighter">
                  {submissions.filter(s => s.submission_status === "shortlisted" || s.submission_status === "winner").length}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex h-[30vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-black" />
          </div>
        )}

        {/* Empty state */}
        {!loading && submissions.length === 0 && (
          <div className="border border-black/10 py-24 text-center">
            <div className="mb-8 inline-flex h-16 w-16 items-center justify-center border border-black mx-auto">
              <FileText className="h-7 w-7 text-black" />
            </div>
            <h3 className="text-2xl font-bold uppercase tracking-tight">No submissions yet</h3>
            <p className="mt-4 text-sm text-black/60 max-w-md mx-auto leading-relaxed">
              You haven't submitted any projects to the 2026 AI Architecture Awards. The clock is ticking.
            </p>
            <Link
              to="/submit"
              className="mt-10 inline-flex items-center gap-3 bg-black px-8 py-4 text-xs font-bold uppercase tracking-[0.3em] text-white hover:bg-gray-800 transition-all"
            >
              <span>Submit Your First Project</span>
            </Link>
          </div>
        )}

        {/* Submissions list */}
        {!loading && submissions.length > 0 && (
          <div className="space-y-px bg-black/10 border border-black/10">
            {submissions.map((submission) => {
              const fee = computeFeePaid(submission);
              const submittedDate = submission.created_at
                ? new Date(submission.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "—";
              const status = submission.submission_status;
              return (
                <motion.div
                  key={submission.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-start"
                >
                  {/* Thumbnail */}
                  <div className="md:col-span-2">
                    <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                      {submission.image_urls?.[0] ? (
                        <img
                          src={submission.image_urls[0]}
                          alt={submission.project_title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-black/10 text-2xl font-bold">
                          —
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Main info */}
                  <div className="md:col-span-6 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {submission.category?.map((catId) => (
                        <span key={catId} className="font-mono text-[9px] uppercase tracking-[0.3em] text-black/40">
                          {CATEGORIES.find(c => c.id === catId)?.title || catId}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold uppercase tracking-tight leading-tight">
                      {submission.project_title}
                    </h3>
                    {submission.short_description && (
                      <p className="text-sm text-black/60 line-clamp-2 leading-relaxed">
                        {submission.short_description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono uppercase tracking-[0.3em] text-black/40 pt-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>{submittedDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {submission.payment_status === "completed" ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            <span className="text-green-700">Payment confirmed</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 text-yellow-600" />
                            <span className="text-yellow-700">Payment pending</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Fee + Status */}
                  <div className="md:col-span-2 md:text-right">
                    <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-black/40">Fee Paid</div>
                    <div className="mt-2 text-3xl font-bold tracking-tighter">${fee}</div>
                  </div>

                  {/* Status badge */}
                  <div className="md:col-span-2 md:text-right">
                    <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-black/40 mb-2">Status</div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border",
                        status === "winner" && "bg-black text-white border-black",
                        status === "shortlisted" && "border-black text-black",
                        status === "submitted" && "border-gray-200 text-gray-500"
                      )}
                    >
                      {status === "winner" && <Award className="h-3 w-3" />}
                      <span>{status}</span>
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Helper */}
        <div className="mt-16 border-t border-black/10 pt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <p className="text-sm text-black/60 max-w-lg leading-relaxed">
            Need to update a submission or have a question about your entries? Email{" "}
            <a href="mailto:info@aiarchitectureawards.com" className="underline hover:no-underline">
              info@aiarchitectureawards.com
            </a>
          </p>
          <Link
            to="/submit"
            className="inline-flex items-center gap-3 border border-black px-6 py-4 text-xs font-bold uppercase tracking-[0.3em] hover:bg-black hover:text-white transition-all"
          >
            <span>Submit Another Project</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
