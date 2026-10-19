import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Mail, Loader2, CheckCircle2 } from "lucide-react";

const DISMISS_KEY = "aiaa_subscribe_dismissed_at";
const SUBSCRIBED_KEY = "aiaa_subscribed";
const SHOW_AFTER_MS = 12_000;              // 12s on first page
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days after dismiss

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

function shouldShow(): boolean {
  try {
    if (localStorage.getItem(SUBSCRIBED_KEY) === "1") return false;
    const d = localStorage.getItem(DISMISS_KEY);
    if (!d) return true;
    return Date.now() - parseInt(d, 10) > SNOOZE_MS;
  } catch {
    return true;
  }
}

export default function SubscribePopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shouldShow()) return;
    const t = setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setVisible(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const addr = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) {
      setError("Please enter a valid email address.");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/subscribers`, {
        method: "POST",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal,resolution=ignore-duplicates",
        },
        body: JSON.stringify({ email: addr, source: "popup" }),
      });
      if (!res.ok && res.status !== 409) {
        const txt = await res.text();
        throw new Error(`${res.status}: ${txt}`);
      }
      try {
        localStorage.setItem(SUBSCRIBED_KEY, "1");
      } catch {}
      setStatus("success");
      setTimeout(() => setVisible(false), 2500);
    } catch (err: any) {
      setStatus("error");
      setError(err?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
            onClick={dismiss}
          />
          <motion.div
            role="dialog"
            aria-label="Subscribe for 2027 announcement"
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="fixed left-1/2 top-1/2 z-[100] w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 border border-black bg-white p-10 shadow-2xl"
          >
            <button
              onClick={dismiss}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-sm p-1 text-black/40 hover:bg-black/5 hover:text-black"
            >
              <X className="h-5 w-5" />
            </button>

            {status === "success" ? (
              <div className="flex flex-col items-center text-center py-6">
                <CheckCircle2 className="h-10 w-10 text-black mb-5" strokeWidth={1.5} />
                <h3 className="text-xl font-bold uppercase tracking-tight">You're on the list</h3>
                <p className="mt-3 text-sm text-black/60 leading-relaxed">
                  We'll email you the moment 2027 registration opens — and send you Early Entry pricing before public launch.
                </p>
              </div>
            ) : (
              <>
                <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-black/40 mb-3">
                  2027 Edition · Opens Soon
                </div>
                <h2 className="text-3xl font-bold uppercase tracking-tighter leading-[0.95]">
                  Be first to <br />enter 2027.
                </h2>
                <p className="mt-5 text-sm text-black/60 leading-relaxed">
                  The 2026 cycle is closing. Join our list to get notified the moment the <strong className="text-black">2027 AI Architecture Awards</strong> opens for submissions — with early-bird pricing access ahead of public launch.
                </p>

                <form onSubmit={submit} className="mt-7 space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
                    <input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      required
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={status === "loading"}
                      className="w-full border border-black/20 bg-transparent py-4 pl-12 pr-5 text-sm tracking-wide outline-none transition-colors focus:border-black focus:bg-black/[0.02] disabled:opacity-50"
                    />
                  </div>

                  {error && (
                    <p className="border-l-2 border-red-500 bg-red-50 px-4 py-2.5 text-xs text-red-700">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="flex w-full items-center justify-center gap-3 bg-black py-5 text-xs font-bold uppercase tracking-[0.3em] text-white transition-all hover:bg-gray-800 disabled:opacity-50"
                  >
                    {status === "loading" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Notify Me First"
                    )}
                  </button>

                  <p className="text-[10px] text-black/40 leading-relaxed pt-1">
                    One email when 2027 opens. No spam, unsubscribe anytime.
                  </p>
                </form>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
