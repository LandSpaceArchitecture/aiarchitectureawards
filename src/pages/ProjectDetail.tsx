import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Mail, Video, Calendar, Award, Loader2, Share2, X, ChevronLeft, ChevronRight, Lock, ThumbsUp } from "lucide-react";
import { submissionService, Submission } from "@/src/services/submissionService";
import { voteService } from "@/src/services/voteService";
import { CATEGORIES } from "@/src/constants";
import { useAuth } from "@/src/contexts/AuthContext";
import { cn } from "@/src/lib/utils";

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isJury, loading: authLoading, user, supabaseUser } = useAuth();
  const isAuthorized = isAdmin || isJury;
  const isLoggedIn = !!(user || supabaseUser);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [voteCount, setVoteCount] = useState<number>(0);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [voting, setVoting] = useState<boolean>(false);

  // Close lightbox on Escape, arrow keys to navigate
  useEffect(() => {
    if (lightboxIdx === null || !submission) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowRight") setLightboxIdx(prev =>
        prev === null ? null : Math.min(prev + 1, submission.image_urls.length - 1)
      );
      if (e.key === "ArrowLeft") setLightboxIdx(prev =>
        prev === null ? null : Math.max(prev - 1, 0)
      );
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIdx, submission]);

  useEffect(() => {
    if (!id || !isAuthorized) return;
    const fetchProject = async () => {
      try {
        const data = await submissionService.getSubmissionById(id);
        if (data) {
          setSubmission(data);
          // Fetch vote info in parallel
          const [count, myVotes] = await Promise.all([
            voteService.getCount(id),
            voteService.getMyVotes(),
          ]);
          setVoteCount(count);
          setHasVoted(myVotes.has(id));
        } else {
          navigate("/gallery");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id, navigate, isAuthorized]);

  const handleToggleVote = async () => {
    if (!id || voting) return;
    setVoting(true);
    const previouslyVoted = hasVoted;
    // Optimistic update
    setHasVoted(!previouslyVoted);
    setVoteCount(c => c + (previouslyVoted ? -1 : 1));
    try {
      if (previouslyVoted) {
        await voteService.unvote(id);
      } else {
        await voteService.vote(id);
      }
    } catch (err: any) {
      console.error("Vote failed:", err);
      // Revert on error
      setHasVoted(previouslyVoted);
      setVoteCount(c => c + (previouslyVoted ? 1 : -1));
      alert(`Vote failed: ${err.message || err}`);
    } finally {
      setVoting(false);
    }
  };

  if (authLoading || (isAuthorized && loading)) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  // Auth gate: only jury + admin can view project details
  if (!isAuthorized) {
    return (
      <div className="mx-auto max-w-md px-4 py-32 text-center">
        <div className="mb-12 flex h-24 w-24 items-center justify-center border border-black mx-auto">
          <Lock className="h-10 w-10 text-black" />
        </div>
        <h2 className="text-4xl font-bold uppercase tracking-tighter">Restricted Access</h2>
        <p className="mt-6 text-gray-500 leading-relaxed">
          Project details are reserved for jury members and administrators only.
        </p>
        <div className="mt-12 space-y-4">
          {!isLoggedIn ? (
            <Link
              to={`/login?redirect=/project/${id}`}
              className="block w-full bg-black py-6 text-xs font-bold uppercase tracking-[0.3em] text-white transition-all hover:bg-gray-800"
            >
              Sign In
            </Link>
          ) : (
            <Link
              to="/"
              className="block w-full border border-black py-6 text-xs font-bold uppercase tracking-[0.3em] text-black transition-all hover:bg-gray-50"
            >
              Return Home
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (!submission) return null;

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[80vh] w-full overflow-hidden cursor-pointer" onClick={() => setLightboxIdx(0)}>
        <img
          src={submission.image_urls[0]}
          alt={submission.project_title}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-center space-x-4">
              {submission.is_featured && (
                <div className="bg-white p-2">
                  <Award className="h-4 w-4 text-black" />
                </div>
              )}
              <span className="text-xs font-bold uppercase tracking-[0.5em] text-white/80">
                {submission.category.map(c => CATEGORIES.find(cat => cat.id === c)?.title).join(" / ")}
              </span>
            </div>
            <h1 className="text-6xl font-bold uppercase tracking-tighter text-white sm:text-9xl">
              {submission.project_title}
            </h1>
            {isAdmin ? (
              <div className="flex items-center justify-center space-x-8 pt-8">
                <div className="text-left">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Lead Architect</span>
                  <p className="text-lg font-bold uppercase tracking-tight text-white">{submission.author_name}</p>
                </div>
                <div className="h-8 w-[1px] bg-white/20" />
                <div className="text-left">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Location</span>
                  <p className="text-lg font-bold uppercase tracking-tight text-white">{submission.country}</p>
                </div>
              </div>
            ) : (
              <div className="pt-8 inline-flex items-center gap-3 border border-white/20 bg-white/5 px-4 py-2">
                <Lock className="h-3 w-3 text-white/60" />
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/60">
                  Submitter info hidden — blind review
                </span>
              </div>
            )}
          </motion.div>
        </div>
        
        <Link
          to="/gallery"
          className="absolute left-8 top-32 flex items-center space-x-4 text-[10px] font-bold uppercase tracking-[0.3em] text-white transition-all hover:translate-x-[-4px]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Index</span>
        </Link>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
          {/* Main Text */}
          <div className="lg:col-span-8 space-y-20">
            <section>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-400 mb-12">Project Manifesto</h2>
              <p className="text-3xl font-medium leading-tight text-black sm:text-4xl">
                {submission.short_description}
              </p>
              <div className="mt-16 prose prose-2xl prose-black max-w-none">
                <p className="text-xl text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {submission.full_description}
                </p>
              </div>
              {(submission as any).ai_tools && (
                <div className="mt-16 pt-10 border-t border-black/10">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-400 mb-4">AI Tools Used</h3>
                  <p className="text-base leading-relaxed text-black/70">
                    {(submission as any).ai_tools}
                  </p>
                </div>
              )}
            </section>

            {/* Image Gallery — ALL images, no cropping, click to enlarge */}
            <section className="space-y-8">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-400">Visual Documentation</h2>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
                  {submission.image_urls.length} {submission.image_urls.length === 1 ? "image" : "images"} · Click to enlarge
                </span>
              </div>
              <div className="space-y-6">
                {submission.image_urls.map((url, idx) => (
                  <motion.button
                    type="button"
                    key={idx}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    onClick={() => setLightboxIdx(idx)}
                    className="block w-full overflow-hidden bg-gray-100 border border-black/5 group cursor-zoom-in"
                  >
                    <img
                      src={url}
                      alt={`${submission.project_title} ${idx === 0 ? "cover" : `detail ${idx}`}`}
                      className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-[1.02]"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  </motion.button>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-16">
            <div className="border border-black p-12 space-y-12 sticky top-32">
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-400 mb-6">Submission Data</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Status</span>
                    <span className="text-xs font-bold uppercase tracking-widest bg-black text-white px-3 py-1">
                      {submission.submission_status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Submitted</span>
                    <div className="flex items-center space-x-2 text-xs font-bold">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(submission.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Jury Vote — available to jury + admin */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-400 mb-6">Jury Vote</h3>
                <div className="space-y-3">
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl font-bold tracking-tighter tabular-nums">{voteCount}</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
                      {voteCount === 1 ? "vote" : "votes"}
                    </span>
                  </div>
                  <button
                    onClick={handleToggleVote}
                    disabled={voting}
                    className={cn(
                      "w-full flex items-center justify-center gap-3 px-6 py-4 text-xs font-bold uppercase tracking-[0.3em] border-2 transition-all disabled:opacity-50",
                      hasVoted
                        ? "bg-black text-white border-black hover:bg-gray-800"
                        : "bg-transparent text-black border-black hover:bg-black hover:text-white"
                    )}
                  >
                    {voting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ThumbsUp className={cn("h-4 w-4", hasVoted && "fill-current")} />
                        <span>{hasVoted ? "Voted — click to remove" : "Vote for this project"}</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    {isAdmin
                      ? "As admin you can vote and also see vote counts in the Admin Panel."
                      : "Your vote is anonymous to other jurors. You can change it any time before the deadline."}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-400 mb-6">Connect</h3>
                <div className="space-y-4">
                  {isAdmin && (
                    <a
                      href={`mailto:${submission.email}`}
                      className="flex items-center space-x-4 text-xs font-bold uppercase tracking-widest hover:text-gray-500 transition-colors"
                    >
                      <Mail className="h-4 w-4" />
                      <span>Contact Architect</span>
                    </a>
                  )}
                  {submission.video_url && (
                    <a
                      href={submission.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-4 text-xs font-bold uppercase tracking-widest hover:text-gray-500 transition-colors"
                    >
                      <Video className="h-4 w-4" />
                      <span>Watch Cinematic</span>
                    </a>
                  )}
                  <button className="flex items-center space-x-4 text-xs font-bold uppercase tracking-widest hover:text-gray-500 transition-colors">
                    <Share2 className="h-4 w-4" />
                    <span>Share Project</span>
                  </button>
                </div>
              </div>

              <div className="pt-8 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 leading-relaxed uppercase tracking-widest">
                  This project is part of the official AI Architecture Awards 2026 selection. All rights reserved by the author.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxIdx(null)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(null); }}
              className="absolute top-6 right-6 z-10 h-12 w-12 flex items-center justify-center border border-white/30 text-white hover:bg-white hover:text-black transition-all"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {lightboxIdx > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
                className="absolute left-6 z-10 h-12 w-12 flex items-center justify-center border border-white/30 text-white hover:bg-white hover:text-black transition-all"
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            {lightboxIdx < submission.image_urls.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
                className="absolute right-6 z-10 h-12 w-12 flex items-center justify-center border border-white/30 text-white hover:bg-white hover:text-black transition-all"
                aria-label="Next"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}

            <motion.img
              key={lightboxIdx}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              src={submission.image_urls[lightboxIdx]}
              alt={`${submission.project_title} ${lightboxIdx + 1}`}
              className="max-h-[90vh] max-w-[90vw] object-contain"
              referrerPolicy="no-referrer"
              onClick={(e) => e.stopPropagation()}
            />

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.4em] text-white/60">
              {lightboxIdx + 1} / {submission.image_urls.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
