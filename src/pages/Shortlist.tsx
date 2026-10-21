import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Loader2, ThumbsUp, Search, Clock } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { CATEGORIES, PARTNERS } from "@/src/constants";
import { submissionService, Submission } from "@/src/services/submissionService";
import {
  publicVoteService,
  PUBLIC_VOTE_DEADLINE_UTC,
  isPublicVoteOpen,
} from "@/src/services/publicVoteService";
import { useAuth } from "@/src/contexts/AuthContext";
import { usePageMeta } from "@/src/hooks/usePageMeta";
import { imgSrc } from "@/src/lib/imgSrc";

// Admin-only jury weight for the internal Top-10 ranking.
// Boosted above the public-facing ×5 so highly jury-endorsed projects
// (e.g. jury=5) are not displaced by heavy public-vote mobilization.
const ADMIN_JURY_WEIGHT = 13;

// PRIMARY awards: Top 10 by Combined Score (receive cash prize + full sponsor package).
// After-Breath removed from Top 10 as same-team as DANCHEONG; Voxel Terra promoted into #10.
const TOP_10: Array<{ match: string; rank: number }> = [
  { match: "crystal spiral",           rank: 1 },
  { match: "beneath the still water",  rank: 2 },
  { match: "house that never existed", rank: 3 },
  { match: "dancheong",                rank: 4 },
  { match: "multimodal architecture",  rank: 5 },
  { match: "landscape remembers",      rank: 6 },
  { match: "casa patio",               rank: 7 },
  { match: "last voice",               rank: 8 },
  { match: "canopia",                  rank: 9 },
  { match: "voxel terra",              rank: 10 },
];

// SECONDARY: 8 Category Recognition (jury-only pick per discipline; may overlap Top 10).
const CATEGORY_RECOGNITION: Array<{ match: string; label: string }> = [
  { match: "voxel terra",              label: "ARCHITECTURE" },
  { match: "after macbeth",            label: "INTERIOR" },
  { match: "aitopia",                  label: "VISUALIZATION" },
  { match: "odyssey to peter",         label: "ANIMATION" },
  { match: "monster",                  label: "URBAN" },
  { match: "after breath",             label: "LANDSCAPE" },
  { match: "canopia",                  label: "REAL ESTATE" },
  { match: "city scanner",             label: "DIAGRAM & MAPPING" },
];

function findTop10(title: string): number | null {
  const t = title.toLowerCase();
  for (const w of TOP_10) if (t.includes(w.match)) return w.rank;
  return null;
}
function findCategory(title: string): string | null {
  const t = title.toLowerCase();
  for (const c of CATEGORY_RECOGNITION) if (t.includes(c.match)) return c.label;
  return null;
}

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
    title: "2026 Shortlist Vote",
    description:
      "Vote for your favourite project in the AI Architecture Awards 2026 shortlist. Public votes contribute to the final combined score (jury × 5 + public). Voting closes October 19, 2026.",
    canonicalPath: "/shortlist",
  });

  const { user, supabaseUser, isAdmin } = useAuth();
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
      // Public: stable order by id (hides rank).
      // Admin: Top 10 first (ranked 1-10), then Category Recognition only,
      // then everyone else by combined score.
      .sort((a, b) => {
        if (isAdmin) {
          const aRank = findTop10(a.project_title);
          const bRank = findTop10(b.project_title);
          if (aRank && bRank) return aRank - bRank;
          if (aRank) return -1;
          if (bRank) return 1;
          const aCat = findCategory(a.project_title);
          const bCat = findCategory(b.project_title);
          if (aCat && !bCat) return -1;
          if (!aCat && bCat) return 1;
          const aCombined = (a.jury_vote_count ?? 0) * ADMIN_JURY_WEIGHT + (publicCounts.get(a.id) ?? 0);
          const bCombined = (b.jury_vote_count ?? 0) * ADMIN_JURY_WEIGHT + (publicCounts.get(b.id) ?? 0);
          if (bCombined !== aCombined) return bCombined - aCombined;
          return (b.jury_vote_count ?? 0) - (a.jury_vote_count ?? 0);
        }
        return a.id.localeCompare(b.id);
      });
  }, [submissions, filter, search, isAdmin, publicCounts]);

  // Admin only: compute the Top 10 projects with the "one person, one slot"
  // rule — if an author (identified by email) already has a higher-scored
  // project in the gold list, their second project is skipped.
  const goldIds = useMemo(() => {
    if (!isAdmin) return new Set<string>();
    const seenEmails = new Set<string>();
    const gold = new Set<string>();
    for (const s of shortlisted) {
      const email = (s.email || "").trim().toLowerCase();
      if (email && seenEmails.has(email)) continue;
      if (email) seenEmails.add(email);
      gold.add(s.id);
      if (gold.size >= 10) break;
    }
    return gold;
  }, [shortlisted, isAdmin]);

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
      {/* AI Partners banner */}
      <section className="border-b border-black/10 bg-white pt-24 pb-16 md:pt-28 md:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 mb-10 md:mb-12 items-end">
            <div className="lg:col-span-7">
              <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-black/40 mb-3">
                Official AI Partners
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold uppercase tracking-tighter leading-[0.9]">
                AI <span className="text-black/20">Partners</span>
              </h2>
            </div>
            <div className="lg:col-span-5 lg:pl-12">
              <p className="text-sm md:text-base text-black/60 leading-relaxed">
                Winners of the 2026 AI Architecture Awards receive{" "}
                <strong className="text-black">Pro licenses or Premium subscriptions</strong> from
                our official AI platform partners — exclusive access to the tools reshaping the
                discipline.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-black/10 border border-black/10">
            {PARTNERS.map((partner) => (
              <a
                key={partner.name}
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white px-8 py-14 md:px-12 md:py-20 flex items-center justify-center min-h-[280px] transition-all hover:bg-black/[0.02] relative overflow-hidden"
              >
                <img
                  src={partner.logo}
                  alt={`${partner.name} logo`}
                  className="max-h-20 md:max-h-24 w-auto max-w-[80%] object-contain grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                />
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-black/40">
                    Visit {partner.name} →
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-gray-400">
              AI Architecture Awards 2026
            </span>
            <h1 className="mt-4 text-6xl font-bold uppercase tracking-tighter sm:text-8xl md:text-9xl leading-[0.9]">
              Winners
            </h1>
            <p className="mt-6 text-base md:text-lg text-black/60 leading-relaxed max-w-xl">
              The 2026 cycle celebrates its overall winners, category recognitions, and the full
              shortlist of jury-selected finalists — representing a wide range of practices and
              perspectives in AI-assisted design from around the world.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-6 border border-red-500 bg-red-50 px-6 py-4 text-xs font-bold uppercase tracking-widest text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Sectioned grid: Winners / Category Recognition / Shortlist */}
      <div className="mx-auto max-w-7xl px-4 pb-32 sm:px-6 lg:px-8 space-y-24">
        {(() => {
          // Partition into 3 groups
          const winners = [...shortlisted]
            .filter((s) => findTop10(s.project_title))
            .sort((a, b) => (findTop10(a.project_title)! - findTop10(b.project_title)!));
          const categoryOnly = shortlisted
            .filter((s) => !findTop10(s.project_title) && findCategory(s.project_title));
          const rest = shortlisted
            .filter((s) => !findTop10(s.project_title) && !findCategory(s.project_title));

          const renderCard = (s: Submission, idx: number) => {
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
                  {(() => {
                    const rank = findTop10(s.project_title);
                    const cat = findCategory(s.project_title);
                    const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank ? "🏆" : "";
                    return (
                      <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                        {rank && (
                          <div className="bg-yellow-400 text-black px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest">
                            {medal} #{rank}
                          </div>
                        )}
                        {cat && (
                          <div className="bg-blue-600 text-white px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-widest">
                            🏅 {cat}
                          </div>
                        )}
                      </div>
                    );
                  })()}
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

                  {open && (
                    <button
                      onClick={() => handleVote(s.id)}
                      disabled={busy}
                      className={cn(
                        "flex-shrink-0 flex items-center justify-center gap-2 border px-4 py-3 transition-all",
                        voted
                          ? "bg-black border-black text-white"
                          : "border-black bg-white text-black hover:bg-black hover:text-white",
                        busy && "opacity-50 cursor-wait"
                      )}
                      aria-label={voted ? "Remove vote" : "Vote"}
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ThumbsUp className={cn("h-4 w-4", voted && "fill-white")} />
                      )}
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        {voted ? "Voted" : "Vote"}
                      </span>
                    </button>
                  )}
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
          };

          const SectionTitle = ({ eyebrow, title, count }: { eyebrow: string; title: string; count: number }) => (
            <div className="border-t border-black pt-10 mb-12 flex items-end justify-between gap-6 flex-wrap">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.5em] text-black/40 mb-3">
                  {eyebrow}
                </div>
                <h2 className="text-5xl sm:text-7xl md:text-8xl font-bold uppercase tracking-tighter leading-[0.9]">
                  {title}
                </h2>
              </div>
              <div className="font-mono text-xs text-black/40">{count} {count === 1 ? "project" : "projects"}</div>
            </div>
          );

          return (
            <>
              {winners.length > 0 && (
                <section>
                  <SectionTitle eyebrow="2026 · Combined Score Ranking" title="Winners" count={winners.length} />
                  <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence mode="popLayout">
                      {winners.map((s, idx) => renderCard(s, idx))}
                    </AnimatePresence>
                  </div>
                </section>
              )}

              {categoryOnly.length > 0 && (
                <section>
                  <SectionTitle eyebrow="2026 · Jury Pick per Discipline" title="Category Recognition" count={categoryOnly.length} />
                  <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence mode="popLayout">
                      {categoryOnly.map((s, idx) => renderCard(s, idx))}
                    </AnimatePresence>
                  </div>
                </section>
              )}

              {rest.length > 0 && (
                <section>
                  <SectionTitle eyebrow="2026 · All Jury-Selected Finalists" title="Shortlist" count={rest.length} />
                  <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence mode="popLayout">
                      {rest.map((s, idx) => renderCard(s, idx))}
                    </AnimatePresence>
                  </div>
                </section>
              )}

              {winners.length === 0 && categoryOnly.length === 0 && rest.length === 0 && (
                <div className="flex h-64 flex-col items-center justify-center border border-black border-dashed">
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
                    No projects match your filters
                  </p>
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}
