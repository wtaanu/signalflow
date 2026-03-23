import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth, API_BASE_URL } from "../context/auth-context";
import { Activity, Lock, Zap, Sparkles, AlertCircle } from "lucide-react";

export default function Login() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate("/");
  }, [user, loading, navigate]);

  useEffect(() => {
    const err = sessionStorage.getItem("sf_auth_error");
    if (err) {
      setAuthError(err === "auth_failed" ? "Sign-in failed. Please try again." : err);
      sessionStorage.removeItem("sf_auth_error");
    }
  }, []);

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <div className="glass-panel rounded-3xl p-8 sm:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Activity className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-white">SignalFlow</h1>
              <p className="text-zinc-400 text-sm">LinkedIn Lead Capture CRM</p>
            </div>
          </div>

          <h2 className="text-3xl font-display font-bold text-white mb-2">Welcome back</h2>
          <p className="text-zinc-400 mb-6">Sign in to manage your leads, drafts, and subscription.</p>

          {authError && (
            <div className="flex items-center gap-2 mb-6 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-white text-zinc-900 font-semibold text-sm hover:bg-zinc-100 transition-all shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { icon: Lock, label: "Secure login", sub: "OAuth 2.0" },
              { icon: Zap, label: "Instant access", sub: "No password" },
              { icon: Sparkles, label: "AI drafts", sub: "Included" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="text-center p-3 rounded-2xl bg-white/5">
                <Icon className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-white text-xs font-medium">{label}</p>
                <p className="text-zinc-500 text-xs">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-4">
          By signing in you agree to our Terms of Service. Free plan: 5 saves/month.
        </p>
      </motion.div>
    </div>
  );
}
