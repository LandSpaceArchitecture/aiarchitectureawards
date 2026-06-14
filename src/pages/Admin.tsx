import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Loader2,
  Search,
  Star,
  Trash2,
  ExternalLink,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Award,
  Calendar,
  Mail,
  Globe,
  Users,
  FileText,
  Video,
  CreditCard,
  MapPin,
  Image as ImageIcon,
  Download,
} from "lucide-react";
import { useAuth } from "@/src/contexts/AuthContext";
import { submissionService, Submission } from "@/src/services/submissionService";
import { voteService, Vote } from "@/src/services/voteService";
import { cn } from "@/src/lib/utils";
import { CATEGORIES } from "@/src/constants";
import { Link } from "react-router-dom";

export default function Admin() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);

  // Group votes by submission_id
  const votesBySubmission = votes.reduce((acc, v) => {
    if (!acc[v.submission_id]) acc[v.submission_id] = [];
    acc[v.submission_id].push(v);
    return acc;
  }, {} as Record<string, Vote[]>);

  useEffect(() => {
    if (!isAdmin) return;
    // Poll votes alongside submissions
    const fetchVotes = () => voteService.getAllVotes().then(setVotes).catch(console.error);
    fetchVotes();
    const interval = setInterval(fetchVotes, 30000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    const unsubscribe = submissionService.subscribeToSubmissions((data) => {
      setSubmissions(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const handleStatusUpdate = async (id: string, status: Submission["submission_status"]) => {
    setProcessingId(id);
    try {
      await submissionService.updateSubmissionStatus(id, status);
    } catch (error) {
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    setProcessingId(id);
    try {
      await submissionService.updateSubmission(id, { is_featured: !currentFeatured });
    } catch (error) {
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this submission? This action cannot be undone.")) return;
    setProcessingId(id);
    try {
      await submissionService.deleteSubmission(id);
    } catch (error) {
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      s.project_title.toLowerCase().includes(q) ||
      (s.author_name || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q) ||
      (s.other_credits || "").toLowerCase().includes(q) ||
      (s.country || "").toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || s.submission_status === statusFilter;
    const matchesCategory = categoryFilter === "all" || s.category.includes(categoryFilter);
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const exportCSV = () => {
    const headers = [
      "id", "project_title", "categories", "author_name", "email", "country",
      "team_other_credits", "short_description", "full_description",
      "video_url", "image_count", "image_urls", "submission_status",
      "payment_status", "is_featured", "vote_count", "voters", "submitted_at"
    ];
    const escape = (v: any) => `"${String(v ?? "").replace(/"/g, '""').replace(/\n/g, " ")}"`;
    const rows = filteredSubmissions.map(s => {
      const voters = votesBySubmission[s.id] || [];
      return [
        s.id,
        s.project_title,
        (s.category || []).join("; "),
        s.author_name,
        s.email,
        s.country,
        s.other_credits || "",
        s.short_description,
        s.full_description,
        s.video_url || "",
        (s.image_urls || []).length,
        (s.image_urls || []).join(" | "),
        s.submission_status,
        s.payment_status,
        s.is_featured,
        voters.length,
        voters.map(v => v.voter_name || v.voter_email || v.voter_uid).join("; "),
        s.created_at,
      ].map(escape).join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aiaa-submissions-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || (isAdmin && loading)) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-32 text-center">
        <div className="mb-12 flex h-24 w-24 items-center justify-center border border-black mx-auto text-red-500">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h2 className="text-4xl font-bold uppercase tracking-tighter">Access Restricted</h2>
        <p className="mt-6 text-gray-500 leading-relaxed">
          The administrative console is reserved for authorized personnel. If you believe this is an error, please contact the system administrator.
        </p>
        <Link
          to="/"
          className="mt-12 block w-full bg-black py-6 text-xs font-bold uppercase tracking-[0.3em] text-white transition-all hover:bg-gray-800"
        >
          Return to Safety
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
            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-400">Control Center</span>
            <h1 className="mt-4 text-6xl font-bold uppercase tracking-tighter sm:text-8xl">Admin Panel</h1>
            <p className="mt-8 text-xl text-gray-500 leading-relaxed">
              Managing {submissions.length} global entries for the 2026 AI Architecture Awards.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search title / author / email / team / country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-black bg-transparent py-4 pl-12 pr-6 text-xs font-bold uppercase tracking-widest outline-none focus:bg-gray-50 sm:w-96"
              />
            </div>
            <button
              type="button"
              onClick={exportCSV}
              className="flex items-center justify-center gap-3 border border-black bg-white px-6 py-4 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all"
              title="Export filtered submissions to CSV"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-12 flex flex-wrap gap-4 border-b border-black pb-12">
          <div className="flex items-center space-x-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border-none bg-transparent text-xs font-bold uppercase tracking-widest outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="winner">Winner</option>
            </select>
          </div>
          <div className="h-4 w-[1px] bg-gray-200" />
          <div className="flex items-center space-x-4">
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-black text-left">
                <th className="pb-6 w-8" />
                <th className="pb-6 text-[10px] font-bold uppercase tracking-widest text-gray-400">Project</th>
                <th className="pb-6 text-[10px] font-bold uppercase tracking-widest text-gray-400">Author / Email</th>
                <th className="pb-6 text-[10px] font-bold uppercase tracking-widest text-gray-400">Country</th>
                <th className="pb-6 text-[10px] font-bold uppercase tracking-widest text-gray-400">Category</th>
                <th className="pb-6 text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                <th className="pb-6 text-[10px] font-bold uppercase tracking-widest text-gray-400">Votes</th>
                <th className="pb-6 text-[10px] font-bold uppercase tracking-widest text-gray-400">Featured</th>
                <th className="pb-6 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map((submission) => {
                const expanded = expandedId === submission.id;
                return (
                <React.Fragment key={submission.id}>
                <tr
                  className={cn(
                    "group border-b border-gray-100 transition-colors cursor-pointer",
                    expanded ? "bg-gray-50" : "hover:bg-gray-50"
                  )}
                  onClick={() => setExpandedId(expanded ? null : submission.id)}
                >
                  <td className="py-6 pl-2 align-top">
                    {expanded ? <ChevronDown className="h-4 w-4 text-black" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                  </td>
                  <td className="py-6 align-top">
                    <div className="flex items-center space-x-4">
                      <div className="h-14 w-14 flex-shrink-0 overflow-hidden bg-gray-100">
                        <img src={submission.image_urls[0]} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-[200px]">
                        <p className="text-sm font-bold uppercase tracking-tight">{submission.project_title}</p>
                        <p className="text-[9px] text-gray-400 mt-1 font-mono">
                          {new Date(submission.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 align-top">
                    <p className="text-sm font-medium">{submission.author_name}</p>
                    <a
                      href={`mailto:${submission.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] text-gray-500 hover:text-black break-all"
                    >
                      {submission.email}
                    </a>
                  </td>
                  <td className="py-6 align-top">
                    <span className="text-xs text-gray-600">{submission.country}</span>
                  </td>
                  <td className="py-6 align-top">
                    <div className="flex flex-col gap-1">
                      {submission.category.map(cat => (
                        <span key={cat} className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
                          {CATEGORIES.find(c => c.id === cat)?.title}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-6 align-top" onClick={(e) => e.stopPropagation()}>
                    <div className="relative inline-block group/status">
                      <button className={cn(
                        "flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest px-3 py-1 border transition-all",
                        submission.submission_status === "winner" && "border-black bg-black text-white",
                        submission.submission_status === "shortlisted" && "border-black text-black",
                        submission.submission_status === "submitted" && "border-gray-200 text-gray-400"
                      )}>
                        <span>{submission.submission_status}</span>
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      <div className="absolute left-0 top-full z-10 mt-2 hidden w-40 border border-black bg-white shadow-xl group-hover/status:block">
                        {["submitted", "shortlisted", "winner"].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleStatusUpdate(submission.id, status as any)}
                            className="block w-full px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="py-6 align-top">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold tabular-nums">
                        {votesBySubmission[submission.id]?.length || 0}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                        votes
                      </span>
                    </div>
                  </td>
                  <td className="py-6 align-top" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleToggleFeatured(submission.id, submission.is_featured)}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center border transition-all",
                        submission.is_featured ? "border-black bg-black text-white" : "border-gray-200 text-gray-300 hover:border-black hover:text-black"
                      )}
                    >
                      <Star className={cn("h-4 w-4", submission.is_featured && "fill-current")} />
                    </button>
                  </td>
                  <td className="py-6 text-right align-top" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end space-x-3">
                      <Link
                        to={`/project/${submission.id}`}
                        className="flex h-9 w-9 items-center justify-center border border-black text-black hover:bg-black hover:text-white transition-all"
                        title="Open project page"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(submission.id)}
                        className="flex h-9 w-9 items-center justify-center border border-red-100 text-red-200 hover:border-red-500 hover:text-red-500 transition-all"
                        title="Delete submission"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>

                {expanded && (
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <td colSpan={9} className="p-8">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Contact & Meta */}
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 mb-3">Contact</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-start gap-3">
                                <Users className="h-4 w-4 mt-0.5 text-gray-400 flex-shrink-0" />
                                <div>
                                  <p className="font-bold">{submission.author_name}</p>
                                  <a
                                    href={`mailto:${submission.email}`}
                                    className="text-xs text-gray-600 hover:text-black break-all"
                                  >
                                    {submission.email}
                                  </a>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span className="text-sm">{submission.country}</span>
                              </div>
                            </div>
                          </div>

                          {submission.other_credits && (
                            <div>
                              <h4 className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 mb-3">
                                Team / Other Credits
                              </h4>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                                {submission.other_credits}
                              </p>
                            </div>
                          )}

                          <div>
                            <h4 className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 mb-3">Submission Meta</h4>
                            <div className="space-y-2 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500">Submitted</span>
                                <span className="font-mono">{new Date(submission.created_at).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500">Payment</span>
                                <span className={cn(
                                  "font-bold uppercase tracking-widest px-2 py-0.5",
                                  submission.payment_status === "completed" ? "bg-black text-white" : "bg-yellow-100 text-yellow-800"
                                )}>
                                  {submission.payment_status}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500">Submission ID</span>
                                <span className="font-mono text-[10px] text-gray-400">{submission.id.slice(0, 8)}…</span>
                              </div>
                            </div>
                          </div>

                          {submission.video_url && (
                            <div>
                              <h4 className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 mb-3">Video</h4>
                              <a
                                href={submission.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs text-blue-600 hover:underline break-all"
                              >
                                <Video className="h-3 w-3 flex-shrink-0" />
                                <span>{submission.video_url}</span>
                              </a>
                            </div>
                          )}

                          {/* Voters list */}
                          <div>
                            <h4 className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 mb-3">
                              Jury Voters ({votesBySubmission[submission.id]?.length || 0})
                            </h4>
                            {(votesBySubmission[submission.id]?.length || 0) === 0 ? (
                              <p className="text-xs text-gray-400 italic">No votes yet</p>
                            ) : (
                              <ul className="space-y-2">
                                {votesBySubmission[submission.id].map((v) => (
                                  <li key={v.id} className="text-xs flex flex-col">
                                    <span className="font-bold">{v.voter_name || v.voter_email || v.voter_uid}</span>
                                    {v.voter_email && <span className="text-gray-500">{v.voter_email}</span>}
                                    <span className="text-[10px] text-gray-400 font-mono">
                                      {new Date(v.created_at).toLocaleString()}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>

                        {/* Descriptions */}
                        <div className="lg:col-span-2 space-y-6">
                          <div>
                            <h4 className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 mb-3">
                              Short Description
                            </h4>
                            <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                              {submission.short_description}
                            </p>
                          </div>

                          <div>
                            <h4 className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 mb-3">
                              AI Approach Manifesto
                            </h4>
                            <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                              {submission.full_description}
                            </p>
                          </div>

                          <div>
                            <h4 className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 mb-3">
                              All Images ({submission.image_urls.length})
                            </h4>
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                              {submission.image_urls.map((url, idx) => (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="aspect-square overflow-hidden bg-gray-100 border border-gray-200 hover:border-black transition-all group/img"
                                  title={idx === 0 ? "Cover" : `Image ${idx + 1}`}
                                >
                                  <img
                                    src={url}
                                    alt=""
                                    className="h-full w-full object-cover group-hover/img:scale-105 transition-transform"
                                  />
                                </a>
                              ))}
                            </div>
                            <p className="mt-2 text-[10px] text-gray-400 uppercase tracking-widest">
                              Click any image to open full-size in new tab
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
                );
              })}
            </tbody>
          </table>
          {filteredSubmissions.length === 0 && (
            <div className="py-20 text-center border-b border-gray-100">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">No entries match your search criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
