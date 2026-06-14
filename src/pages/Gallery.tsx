import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Search, ArrowRight, Loader2, Award, Lock } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { CATEGORIES } from "@/src/constants";
import { submissionService, Submission } from "@/src/services/submissionService";
import { useAuth } from "@/src/contexts/AuthContext";

export default function Gallery() {
  const { isAdmin, isJury, loading: authLoading, user, supabaseUser } = useAuth();
  const isAuthorized = isAdmin || isJury;
  const isLoggedIn = !!(user || supabaseUser);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isAuthorized) {
      setLoading(false);
      return;
    }
    const unsubscribe = submissionService.subscribeToSubmissions((data) => {
      setSubmissions(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isAuthorized]);

  if (authLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="mx-auto max-w-md px-4 py-32 text-center">
        <div className="mb-12 flex h-24 w-24 items-center justify-center border border-black mx-auto">
          <Lock className="h-10 w-10 text-black" />
        </div>
        <h2 className="text-4xl font-bold uppercase tracking-tighter">Restricted Access</h2>
        <p className="mt-6 text-gray-500 leading-relaxed">
          The Gallery is reserved for jury members and administrators. Submissions are kept private until the official winners announcement.
        </p>
        <div className="mt-12 space-y-4">
          {!isLoggedIn ? (
            <Link
              to="/login?redirect=/gallery"
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

  const filteredSubmissions = submissions.filter((s) => {
    const matchesFilter = filter === "all" || s.category.includes(filter);
    const matchesSearch = s.project_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.author_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
      <div className="mx-auto max-w-7xl px-4 pt-32 pb-20 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div className="max-w-2xl">
            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-400">Archive 2026</span>
            <h1 className="mt-4 text-6xl font-bold uppercase tracking-tighter sm:text-8xl">The Index</h1>
            <p className="mt-8 text-xl text-gray-500 leading-relaxed">
              A curated collection of visionary architectural concepts, pushing the boundaries of AI-human collaboration.
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
        <div className="mt-16 flex flex-wrap gap-2 border-t border-black pt-8">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all",
              filter === "all" ? "bg-black text-white" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
            )}
          >
            All Domains
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={cn(
                "px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all",
                filter === cat.id ? "bg-black text-white" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
              )}
            >
              {cat.title}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-4 pb-32 sm:px-6 lg:px-8">
        {filteredSubmissions.length > 0 ? (
          <div className="grid grid-cols-1 gap-px bg-black border border-black sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredSubmissions.map((submission, idx) => (
                <motion.div
                  key={submission.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                  className="group relative aspect-[4/5] overflow-hidden bg-white"
                >
                  <Link to={`/project/${submission.id}`} className="block h-full w-full">
                    <img
                      src={submission.image_urls[0]}
                      alt={submission.project_title}
                      className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:scale-110 group-hover:grayscale-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    
                    <div className="absolute bottom-0 left-0 w-full p-8 translate-y-4 transition-transform duration-500 group-hover:translate-y-0">
                      <div className="flex items-center space-x-3 mb-4">
                        {submission.is_featured && (
                          <div className="bg-white p-1">
                            <Award className="h-3 w-3 text-black" />
                          </div>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/60">
                          {submission.category[0]}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold uppercase tracking-tighter text-white">
                        {submission.project_title}
                      </h3>
                      <p className="mt-2 text-xs font-medium text-white/50 line-clamp-1">
                        {submission.author_name} — {submission.country}
                      </p>
                      <div className="mt-6 flex items-center space-x-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white opacity-0 transition-opacity delay-100 group-hover:opacity-100">
                        <span>View Project</span>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center border border-black border-dashed">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">No projects found in this domain</p>
          </div>
        )}
      </div>
    </div>
  );
}
