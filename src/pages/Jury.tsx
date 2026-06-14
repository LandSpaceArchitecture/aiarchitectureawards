import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Loader2,
  Search,
  ShieldAlert,
  Filter,
  Eye,
  ThumbsUp
} from "lucide-react";
import { useAuth } from "@/src/contexts/AuthContext";
import { submissionService, Submission } from "@/src/services/submissionService";
import { voteService } from "@/src/services/voteService";
import { cn } from "@/src/lib/utils";
import { CATEGORIES } from "@/src/constants";
import { Link } from "react-router-dom";

export default function Jury() {
  const { isJury, isAdmin, loading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isJury) return;

    const unsubscribe = submissionService.subscribeToSubmissions((data) => {
      setSubmissions(data);
      setLoading(false);
    });

    // Load this user's votes
    voteService.getMyVotes().then(setMyVotes).catch(console.error);

    return () => unsubscribe();
  }, [isJury]);

  const handleToggleVote = async (id: string) => {
    const previouslyVoted = myVotes.has(id);
    // Optimistic update
    setMyVotes(prev => {
      const next = new Set(prev);
      if (previouslyVoted) next.delete(id);
      else next.add(id);
      return next;
    });
    setProcessingId(id);
    try {
      if (previouslyVoted) {
        await voteService.unvote(id);
      } else {
        await voteService.vote(id);
      }
      console.log("[Jury] Vote toggled:", id, previouslyVoted ? "→ removed" : "→ added");
    } catch (error: any) {
      console.error("[Jury] Vote failed:", error);
      // Revert
      setMyVotes(prev => {
        const next = new Set(prev);
        if (previouslyVoted) next.add(id);
        else next.delete(id);
        return next;
      });
      alert(`Vote failed: ${error.message || error}`);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    // Non-admin jurors only search by project title (blind review — no author name lookup)
    const matchesSearch = isAdmin
      ? (s.project_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
         s.author_name.toLowerCase().includes(searchQuery.toLowerCase()))
      : s.project_title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || s.category.includes(categoryFilter);
    return matchesSearch && matchesCategory;
  });

  if (authLoading || (isJury && loading)) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  if (!isJury) {
    return (
      <div className="mx-auto max-w-md px-4 py-32 text-center">
        <div className="mb-12 flex h-24 w-24 items-center justify-center border border-black mx-auto text-red-500">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h2 className="text-4xl font-bold uppercase tracking-tighter">Jury Access Only</h2>
        <p className="mt-6 text-gray-500 leading-relaxed">
          This portal is reserved for the 2026 AI Architecture Awards Jury. Please authenticate with an authorized account.
        </p>
        <Link
          to="/"
          className="mt-12 block w-full bg-black py-6 text-xs font-bold uppercase tracking-[0.3em] text-white transition-all hover:bg-gray-800"
        >
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-20 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div className="max-w-2xl">
            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-400">Jury Review Portal</span>
            <h1 className="mt-4 text-6xl font-bold uppercase tracking-tighter sm:text-8xl">Review Entries</h1>
            <p className="mt-8 text-xl text-gray-500 leading-relaxed">
              Evaluating {submissions.length} submissions across {CATEGORIES.length} categories.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search Projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-black bg-transparent py-4 pl-12 pr-6 text-xs font-bold uppercase tracking-widest outline-none focus:bg-gray-50 sm:w-64"
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-12 flex flex-wrap gap-4 border-b border-black pb-12">
          <div className="flex items-center space-x-4">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border-none bg-transparent text-xs font-bold uppercase tracking-widest outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-black border border-black">
          {filteredSubmissions.map((submission) => {
            const hasVoted = myVotes.has(submission.id);
            return (
            <div key={submission.id} className="group relative bg-white p-8 transition-all hover:bg-gray-50">
              <div className={cn(
                "aspect-[4/3] overflow-hidden bg-gray-100 mb-8 transition-all duration-700",
                hasVoted ? "grayscale-0" : "grayscale group-hover:grayscale-0"
              )}>
                <img
                  src={submission.image_urls[0]}
                  alt={submission.project_title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {submission.category.map(cat => (
                    <span key={cat} className="text-[8px] font-bold uppercase tracking-widest text-gray-400">
                      {CATEGORIES.find(c => c.id === cat)?.title}
                    </span>
                  ))}
                </div>

                <h3 className="text-2xl font-bold uppercase tracking-tight leading-none">{submission.project_title}</h3>

                <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">
                  {submission.short_description}
                </p>

                <div className="pt-8 flex items-center justify-between border-t border-black/5">
                  <div className="flex space-x-2">
                    <Link
                      to={`/project/${submission.id}`}
                      className="flex h-10 w-10 items-center justify-center border border-black text-black hover:bg-black hover:text-white transition-all"
                      title="View Full Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </div>

                  <button
                    onClick={() => handleToggleVote(submission.id)}
                    disabled={processingId === submission.id}
                    className={cn(
                      "flex items-center space-x-3 px-6 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all",
                      hasVoted
                        ? "bg-black text-white border-black"
                        : "bg-transparent text-black border-black hover:bg-black hover:text-white"
                    )}
                  >
                    {processingId === submission.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <ThumbsUp className={cn("h-3 w-3", hasVoted && "fill-current")} />
                        <span>{hasVoted ? "Voted" : "Vote"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {filteredSubmissions.length === 0 && (
          <div className="py-32 text-center border border-black border-t-0">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">No entries found in this selection</p>
          </div>
        )}
      </div>
    </div>
  );
}
