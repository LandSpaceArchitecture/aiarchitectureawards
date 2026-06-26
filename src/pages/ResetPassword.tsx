import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Lock, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { updatePassword } from "@/src/supabase";
import { cn } from "@/src/lib/utils";
import { usePageMeta } from "@/src/hooks/usePageMeta";

/**
 * Reached via the recovery link emailed by Supabase:
 *   https://www.aiarchitectureawards.com/reset-password#access_token=…&refresh_token=…&type=recovery
 *
 * The tokens live in the URL hash. We extract them, let the user set a new password,
 * then call /auth/v1/user with the access_token to update it.
 */
export default function ResetPassword() {
  usePageMeta({
    title: "Reset Password",
    description: "Set a new password for your AI Architecture Awards account.",
    canonicalPath: "/reset-password",
  });

  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // On mount: parse the URL hash for the access_token from Supabase recovery link
  useEffect(() => {
    const hash = window.location.hash.substring(1); // remove leading "#"
    if (!hash) {
      setTokenError("No recovery token found in this URL. Please request a new reset link.");
      return;
    }
    const params = new URLSearchParams(hash);
    const at = params.get("access_token");
    const type = params.get("type");
    const errorParam = params.get("error_description") || params.get("error");

    if (errorParam) {
      setTokenError(decodeURIComponent(errorParam.replace(/\+/g, " ")));
      return;
    }
    if (!at) {
      setTokenError("Invalid or expired recovery link. Please request a new one.");
      return;
    }
    if (type && type !== "recovery") {
      setTokenError("This link is not a password recovery link.");
      return;
    }
    setAccessToken(at);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!accessToken) {
      setError("Recovery token missing.");
      return;
    }
    if (password.length < 10) {
      setError("Password must be at least 10 characters long.");
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError("Password must contain both letters and numbers.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password, accessToken);
      setSuccess(true);
      // Redirect to login after 3s
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      console.error("[RESET] Failed:", err);
      setError(err.message || "Failed to update password. The link may have expired — request a new one.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="mb-12">
          <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-black/40 mb-4">
            ACCOUNT.RESET / 02
          </div>
          <h1 className="text-5xl md:text-6xl font-bold uppercase tracking-tighter leading-[0.9]">
            Set New <br />Password.
          </h1>
          {!success && !tokenError && (
            <p className="mt-6 text-sm text-black/60 leading-relaxed max-w-sm">
              Choose a strong password — at least 10 characters, including letters and digits.
            </p>
          )}
        </div>

        {tokenError && (
          <div className="border-l-4 border-red-500 bg-red-50 px-5 py-6">
            <p className="text-sm font-medium text-red-700 leading-relaxed">{tokenError}</p>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="mt-6 text-[10px] font-bold uppercase tracking-widest text-red-700 underline hover:no-underline"
            >
              Back to Sign In
            </button>
          </div>
        )}

        {success && (
          <div className="border-l-4 border-green-600 bg-green-50 px-5 py-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800 leading-relaxed">
                  Password updated successfully. Redirecting to Sign In…
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="mt-4 text-[10px] font-bold uppercase tracking-widest text-green-700 underline hover:no-underline"
                >
                  Sign In Now
                </button>
              </div>
            </div>
          </div>
        )}

        {!success && !tokenError && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
              <input
                type="password"
                placeholder="New password"
                required
                minLength={10}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-black/20 bg-transparent py-4 pl-14 pr-5 text-sm tracking-wide outline-none transition-colors focus:border-black focus:bg-black/[0.02]"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
              <input
                type="password"
                placeholder="Confirm new password"
                required
                minLength={10}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={cn(
                  "w-full border bg-transparent py-4 pl-14 pr-5 text-sm tracking-wide outline-none transition-colors focus:bg-black/[0.02]",
                  confirmPassword.length > 0 && confirmPassword !== password
                    ? "border-red-300 focus:border-red-500"
                    : "border-black/20 focus:border-black"
                )}
              />
            </div>

            <p className="-mt-1 px-1 text-[10px] font-mono uppercase tracking-widest text-black/40">
              Minimum 10 characters · Must include letters and digits
            </p>

            {error && (
              <div className="border-l-4 border-red-500 bg-red-50 px-5 py-4">
                <p className="text-xs font-medium text-red-700 leading-relaxed">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !accessToken}
              className="mt-2 flex w-full items-center justify-center gap-4 bg-black py-6 text-sm font-bold uppercase tracking-[0.3em] text-white transition-all hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span>Update Password</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
