import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { Award, LogIn, Mail, Lock, User, Loader2, ArrowRight, Globe } from "lucide-react";
import { loginWithGoogle, loginWithEmail, registerWithEmail, sendPasswordResetEmail, supabase } from "@/src/supabase";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/contexts/AuthContext";

export default function Login() {
  type Mode = "login" | "register" | "forgot";
  const [mode, setMode] = useState<Mode>("login");
  const isRegister = mode === "register";
  const isForgot = mode === "forgot";
  const setIsRegister = (val: boolean) => setMode(val ? "register" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";

  useEffect(() => {
    if (!authLoading && user) {
      navigate(redirectPath);
    }
  }, [user, authLoading, navigate, redirectPath]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(email);
      setResetSent(true);
    } catch (err: any) {
      console.error("[AUTH] Reset request failed:", err);
      const message = err.message || "Failed to send reset email.";
      setError(
        message.includes("Failed to fetch")
          ? "Network error. Please check your connection and try again."
          : message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enforce strong password on registration
    if (isRegister) {
      if (password.length < 10) {
        setError("Password must be at least 10 characters long.");
        return;
      }
      const hasLetter = /[A-Za-z]/.test(password);
      const hasNumber = /\d/.test(password);
      if (!hasLetter || !hasNumber) {
        setError("Password must contain both letters and numbers.");
        return;
      }
    }

    setLoading(true);
    setError("");

    const timeoutId = setTimeout(() => {
      setLoading(prev => {
        if (prev) {
          console.error("Auth timeout reached after 45s");
          setError("Authentication is taking longer than expected. This might be a network issue or Supabase is currently slow. Please try again or use Google login.");
          return false;
        }
        return prev;
      });
    }, 45000); // Increased to 45 seconds

    try {
      console.log(`[AUTH] Attempting ${isRegister ? 'registration' : 'login'} for ${email}...`);

      if (isRegister) {
        console.log("[AUTH] Calling registerWithEmail...");
        const data = await registerWithEmail(email, password, name);
        console.log("[AUTH] Registration successful:", data);
        
        // Non-blocking email send - completely silent to avoid user frustration with fake emails
        fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: email,
            subject: "Welcome to AI Architecture Awards 2026",
            text: `Hello ${name},\n\nThank you for registering for the AI Architecture Awards 2026.`,
            html: `<h1>Welcome</h1><p>Hello ${name},</p><p>Thank you for registering.</p>`
          })
        })
        .then(async (r) => {
          const d = await r.json();
          if (d.status === "error") {
            console.warn("[AUTH] Email skipped or failed:", d.error);
          } else {
            console.log("[AUTH] Welcome email sent.");
          }
        })
        .catch(e => console.warn("[AUTH] Email send failed (silent):", e));
      } else {
        console.log("[AUTH] Calling loginWithEmail...");
        const data = await loginWithEmail(email, password);
        console.log("[AUTH] Login successful:", data);
      }
      
      console.log("[AUTH] Clearing timeout and navigating...");
      clearTimeout(timeoutId);
      // Hard reload so AuthContext re-reads localStorage cleanly (the JS client can hang on getSession)
      window.location.href = redirectPath;
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("[AUTH] Error details:", err);
      let message = err.message || "Authentication failed";
      
      if (message.includes("Failed to fetch")) {
        message = "Network error: Could not connect to authentication server. Please check your internet connection or VPN.";
      } else if (message.includes("User already registered")) {
        message = "This email is already registered. Please sign in instead.";
      } else if (message.includes("Invalid login credentials")) {
        message = "Incorrect email or password.";
      } else if (message.includes("Email not confirmed")) {
        message = "Please confirm your email address. Check your spam folder.";
      }
      
      setError(message);
      setLoading(false);
    }
  };

  const resendConfirmation = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      if (error) throw error;
      alert("Confirmation email resent! Please check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to resend confirmation.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle(redirectPath);
    } catch (err: any) {
      setError(err.message || "Google login failed");
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
        {/* Header */}
        <div className="mb-12">
          <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-black/40 mb-4">
            {isForgot ? "ACCOUNT.RECOVER / 01" : isRegister ? "ACCOUNT.NEW / 01" : "ACCOUNT.AUTH / 01"}
          </div>
          <h1 className="text-5xl md:text-6xl font-bold uppercase tracking-tighter leading-[0.9]">
            {isForgot ? (
              <>Reset <br />Password.</>
            ) : isRegister ? (
              <>Create <br />Account.</>
            ) : (
              <>Welcome <br />Back.</>
            )}
          </h1>
          <p className="mt-6 text-sm text-black/60 leading-relaxed max-w-sm">
            {isForgot
              ? "Enter your account email and we'll send you a link to reset your password."
              : isRegister
              ? "Join the 2026 AI Architecture Awards and submit your visionary work to a global jury."
              : "Sign in to access your submissions, drafts, and account."}
          </p>
        </div>

        {/* Google + Divider — only in login/register modes */}
        {!isForgot && (
          <>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 border-2 border-black bg-white py-5 text-xs font-bold uppercase tracking-[0.3em] text-black transition-all hover:bg-black hover:text-white disabled:opacity-50"
            >
              <Globe className="h-4 w-4" />
              <span>Continue with Google</span>
            </button>

            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-black/10" />
              <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-black/40">
                Or with email
              </span>
              <div className="h-px flex-1 bg-black/10" />
            </div>
          </>
        )}

        {/* Forgot password — request reset email form */}
        {isForgot && (
          <form onSubmit={handlePasswordReset} className="space-y-6">
            {resetSent ? (
              <div className="border-l-4 border-green-600 bg-green-50 px-5 py-6">
                <p className="text-sm font-medium text-green-800 leading-relaxed">
                  If an account exists for <strong>{email}</strong>, a reset link has been sent. Check your inbox (and spam folder) — the link expires in 1 hour.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setResetSent(false);
                    setError("");
                  }}
                  className="mt-6 text-[10px] font-bold uppercase tracking-widest text-green-700 underline hover:no-underline"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
                  <input
                    type="email"
                    placeholder="Email address"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-black/20 bg-transparent py-4 pl-14 pr-5 text-sm tracking-wide outline-none transition-colors focus:border-black focus:bg-black/[0.02]"
                  />
                </div>

                {error && (
                  <div className="border-l-4 border-red-500 bg-red-50 px-5 py-4">
                    <p className="text-xs font-medium text-red-700 leading-relaxed">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center gap-4 bg-black py-6 text-sm font-bold uppercase tracking-[0.3em] text-white transition-all hover:bg-gray-800 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(""); }}
                  className="block w-full text-center text-[10px] font-bold uppercase tracking-widest text-black/60 hover:text-black underline underline-offset-4"
                >
                  ← Back to Sign In
                </button>
              </>
            )}
          </form>
        )}

        {/* Email form — login/register modes only */}
        {!isForgot && (
        <form onSubmit={handleAuth} className="space-y-4">
          {isRegister && (
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
              <input
                type="text"
                placeholder="Full name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-black/20 bg-transparent py-4 pl-14 pr-5 text-sm tracking-wide outline-none transition-colors focus:border-black focus:bg-black/[0.02]"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
            <input
              type="email"
              placeholder="Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-black/20 bg-transparent py-4 pl-14 pr-5 text-sm tracking-wide outline-none transition-colors focus:border-black focus:bg-black/[0.02]"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
            <input
              type="password"
              placeholder={isRegister ? "Password" : "Password"}
              required
              minLength={isRegister ? 10 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-black/20 bg-transparent py-4 pl-14 pr-5 text-sm tracking-wide outline-none transition-colors focus:border-black focus:bg-black/[0.02]"
            />
          </div>

          {/* Password requirements hint (only on register, before user starts typing) */}
          {isRegister && password.length === 0 && (
            <p className="-mt-1 px-1 text-[10px] font-mono uppercase tracking-widest text-black/40">
              Minimum 10 characters · Must include letters and digits
            </p>
          )}

          {/* Password strength meter — only on registration */}
          {isRegister && password.length > 0 && (() => {
            const hasMinLength = password.length >= 10;
            const hasUpper = /[A-Z]/.test(password);
            const hasLower = /[a-z]/.test(password);
            const hasNumber = /\d/.test(password);
            const hasSymbol = /[^A-Za-z0-9]/.test(password);
            const score = [hasMinLength, hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;
            const labels = ["Too weak", "Weak", "Fair", "Good", "Strong", "Excellent"];
            const colors = ["bg-red-500", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-green-600"];
            return (
              <div className="space-y-2 -mt-1 px-1">
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className={cn(
                        "h-1 flex-1 rounded transition-colors",
                        i < score ? colors[score] : "bg-gray-200"
                      )}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
                  <span className={cn(
                    "font-bold",
                    score < 2 && "text-red-600",
                    score >= 2 && score < 4 && "text-orange-600",
                    score >= 4 && "text-green-700",
                  )}>
                    {labels[score]}
                  </span>
                  <span className="text-black/40">
                    {hasMinLength ? "✓" : "✗"} 10+ chars · {hasUpper && hasLower ? "✓" : "✗"} mixed case · {hasNumber ? "✓" : "✗"} number
                  </span>
                </div>
              </div>
            );
          })()}

          {error && (
            <div className="border-l-4 border-red-500 bg-red-50 px-5 py-4">
              <p className="text-xs font-medium text-red-700 leading-relaxed">
                {error}
              </p>
              {error.includes("confirm") && (
                <button
                  type="button"
                  onClick={resendConfirmation}
                  className="mt-3 text-[10px] font-bold uppercase tracking-widest text-red-700 underline hover:no-underline"
                >
                  Resend confirmation email
                </button>
              )}
            </div>
          )}

          {/* Primary CTA — big */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-4 bg-black py-6 text-sm font-bold uppercase tracking-[0.3em] text-white transition-all hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span>{isRegister ? "Register Now" : "Sign In"}</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>

          {/* Forgot password link — only in login mode */}
          {!isRegister && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setMode("forgot"); setError(""); setPassword(""); }}
                className="text-[10px] font-bold uppercase tracking-widest text-black/50 hover:text-black underline underline-offset-4 hover:no-underline"
              >
                Forgot password?
              </button>
            </div>
          )}
        </form>
        )}

        {/* Toggle — hide in forgot mode (it has its own back link) */}
        {!isForgot && (
          <div className="mt-10 border-t border-black/10 pt-8 text-center">
            <p className="text-xs text-black/60">
              {isRegister ? "Already have an account?" : "Don't have an account yet?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError("");
                }}
                className="font-bold uppercase tracking-widest text-black underline underline-offset-4 hover:no-underline"
              >
                {isRegister ? "Sign In" : "Create one"}
              </button>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
