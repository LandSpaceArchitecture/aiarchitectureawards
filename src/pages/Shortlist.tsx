import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Loader2, ThumbsUp, Search, Clock } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { CATEGORIES } from "@/src/constants";
import { submissionService, Submission } from "@/src/services/submissionService";
import {
  publicVoteService,
  PUBLIC_VOTE_DEADLINE_UTC,
  isPublicVoteOpen,
} from "@/src/services/publicVoteService";
import { useAuth } from "@/src/contexts/AuthContext";
import { usePageMeta } from "@/src/hooks/usePageMeta";
import { imgSrc } from "@/src/lib/imgSrc";

function useCountdown(targetIso: string) {
  const target = new Date(targetIso).getTime();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return { days, hours, minutes, seconds, closed: diff === 0 };
}

export default function Shortlist() {
  usePageMeta({
    title: "People's Choice — Shortlist 2026",
    description:
      "Vote for your favourite project in the AI Architecture Awards 2026 shortlist. Jury-selected finalists compete for the People's Choice prize. Voting closes October 19, 2026.",
    canonicalPath: "/shortlist",
  });

  const { user, supabaseUser } = useAuth();
  const isLoggedIn = !!(user || supabaseUser);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [publicCounts, setPublicCounts] = useState<Map<string, number>>(new Map());
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [voting, setVoting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const countdown = useCountdown(PUBLIC_VOTE_DEADLINE_UTC);
  const open = isPublicVoteOpen();

  useEffect(() => {
    const unsubscribe = submissionService.subscribeToSubmissions((data) => {
      setSubmissions(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const refreshCounts = () =>
      publicVoteService.getAllCounts().then(setPublicCounts).catch(console.error);
    refreshCounts();
    const t = setInterval(refreshCounts, 15000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setMyVotes(new Set());
      return;
    }
    publicVoteService.getMyVotes().then(setMyVotes).catch(() => setMyVotes(new Set()));
  }, [isLoggedIn]);

  const shortlisted = useMemo(() => {
    const q = search.trim().toLowerCase();
    return submissions
      .filter((s) => (s.jury_vote_count ?? 0) >= 1)
      .filter((s) => filter === "all" || s.category.includes(filter))
      .filter((s) => {
        if (!q) return true;
        return (
          s.project_title.toLowerCase().includes(q) ||
          s.author_name.toLowerCase().includes(q) ||
          s.country.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const ac = publicCounts.get(a.id) ?? 0;
        const bc = publicCounts.get(b.id) ?? 0;
        if (bc !== ac) return bc - ac;
        return (b.jury_vote_count ?? 0) - (a.jury_vote_count ?? 0);
      });
  }, [submissions, publicCounts, filter, search]);

  const handleVote = async (submissionId: string) => {
    if (!isLoggedIn) {
      window.location.href = `/login?redirect=/shortlist`;
      return;
    }
    if (!open) return;
    setError(null);
    setVoting(submissionId);

    const hadVoted = myVotes.has(submissionId);
    const newMyVotes = new Set(myVotes);
    const newCounts = new Map(publicCounts);
    if (hadVoted) {
      newMyVotes.delete(submissionId);
      newCounts.set(submissionId, Math.max(0, (newCounts.get(submissionId) ?? 0) - 1));
    } else {
      newMyVotes.add(submissionId);
      newCounts.set(submissionId, (newCounts.get(submissionId) ?? 0) + 1);
    }
    setMyVotes(newMyVotes);
    setPublicCounts(newCounts);

    try {
      if (hadVoted) await publicVoteService.unvote(submissionId);
      else await publicVoteService.vote(submissionId);
    } catch (e: any) {
      setMyVotes(myVotes);
      setPublicCounts(publicCounts);
      setError(e?.message ?? "Vote failed. Please try again.");
    } finally {
      setVoting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 pt-24 pb-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-gray-400">
              People's Choice / 2026
            </span>
            <h1 className="mt-4 text-5xl font-bold uppercase tracking-tighter sm:text-7xl md:text-8xl leading-[0.9]">
              Shortlist
            </h1>
            <p className="mt-6 text-base md:text-lg text-black/60 leading-relaxed max-w-xl">
              Jury-selected finalists. Vote for the one you'd most like to see win the public prize.
              The top 10 (combined jury + public score) receive sponsor tokens, a certificate, and
              the option to purchase a physical trophy.
            </p>
          </div>

          <div className="flex-shrink-0 border border-black p-6 md:p-8 min-w-[260px]">
            <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-gray-400 flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Voting closes
            </div>
            {open ? (
              <div className="mt-3 font-mono text-2xl md:text-3xl font-bold tracking-tight tabular-nums">
                {countdown.days}d {String(countdown.hours).padStart(2, "0")}h{" "}
                {String(countdown.minutes).padStart(2, "0")}m{" "}
                {String(countdown.seconds).padStart(2, "0")}s
              </div>
            ) : (
              <div className="mt-3 font-mono text-xl md:text-2xl font-bold tracking-tight">
                CLOSED
              </div>
            )}
            <div className="mt-2 text-[11px] text-black/50">Oct 19, 2026 · 23:59 UTC</div>
          </div>
        </div>

        {/* Filters + Search */}
        <div className="mt-12 flex flex-col gap-6 border-t border-black pt-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] transition-all",
                filter === "all"
                  ? "bg-black text-white"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              )}
            >
              All ({shortlisted.length})
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                className={cn(
                  "px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] transition-all",
                  filter === cat.id
                    ? "bg-black text-white"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                )}
              >
                {cat.title}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search title, author, country"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-black bg-transparent py-3 pl-12 pr-6 text-xs font-bold uppercase tracking-widest outline-none focus:bg-gray-50 md:w-80"
            />
          </div>
        </div>

        {/* Voting-integrity notice */}
        <div className="mt-6 border border-black/20 bg-gray-50 px-6 py-4 text-xs leading-relaxed text-black/70">
          <span className="font-bold uppercase tracking-widest text-black">Voting Notice · </span>
          Voters can both vote and unvote at any time, so individual project counts naturally
          fluctuate throughout the voting period. We cannot alter voters' choices — all counts
          are tallied automatically by our system directly from the database. The final result
          is determined by the combined score (<span className="font-bold">jury × 5 + public</span>)
          at voting close on October 19, 23:59 UTC.
        </div>

        {error && (
          <div className="mt-6 border border-red-500 bg-red-50 px-6 py-4 text-xs font-bold uppercase tracking-widest text-red-700">
            {error}
          </div>
        )}

        {!isLoggedIn && (
          <div className="mt-6 border border-black bg-black text-white px-6 py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-between gap-4">
            <span>Sign in to cast your vote.</span>
            <Link
              to="/login?redirect=/shortlist"
              className="underline hover:no-underline"
            >
              Sign In →
            </Link>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-4 pb-32 sm:px-6 lg:px-8">
        {shortlisted.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center border border-black border-dashed">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
              No projects match your filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {shortlisted.map((s, idx) => {
                const pubCount = publicCounts.get(s.id) ?? 0;
                const voted = myVotes.has(s.id);
                const busy = voting === s.id;
                return (
                  <motion.div
                    key={s.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, delay: Math.min(idx, 10) * 0.03 }}
                    className="flex flex-col group"
                  >
                    <Link
                      to={`/project/${s.id}`}
                      className="relative block aspect-[4/5] overflow-hidden border border-black bg-gray-50"
                    >
                      <img
                        src={imgSrc(s.image_urls?.[0], "card")}
                        alt={s.project_title}
                        className="h-full w-full object-cover transition-all duration-700 group-hover:scale-[1.03]"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3 bg-white px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-black">
                        #{idx + 1}
                      </div>
                    </Link>

                    <div className="mt-4 flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-gray-400 mb-1">
                          {s.category[0]}
                        </div>
                        <h3 className="text-lg font-bold uppercase tracking-tight leading-tight line-clamp-2">
                          {s.project_title}
                        </h3>
                        <p className="mt-1 text-xs font-semibold text-black line-clamp-1">
                          {s.author_name}
                        </p>
                        <p className="text-[11px] text-black/50 line-clamp-1">
                          {s.country}
                        </p>
                        {s.ai_tools && (
                          <p className="mt-2 text-[10px] font-mono uppercase tracking-wider text-black/40 line-clamp-2">
                            <span className="text-black/30">AI · </span>
                            {s.ai_tools}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleVote(s.id)}
                        disabled={busy || !open}
                        className={cn(
                          "flex-shrink-0 flex flex-col items-center justify-center border w-16 py-2 transition-all",
                          voted
                            ? "bg-black border-black text-white"
                            : "border-black bg-white text-black hover:bg-black hover:text-white",
                          busy && "opacity-50 cursor-wait",
                          !open && "opacity-40 cursor-not-allowed hover:bg-white hover:text-black"
                        )}
                        aria-label={voted ? "Remove vote" : "Vote"}
                      >
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ThumbsUp className={cn("h-4 w-4", voted && "fill-white")} />
                        )}
                        <span className="mt-1 text-xs font-bold tabular-nums">{pubCount}</span>
                      </button>
                    </div>

                    <Link
                      to={`/project/${s.id}`}
                      className="mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-black/60 hover:text-black transition-colors"
                    >
                      <span>View Project</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
