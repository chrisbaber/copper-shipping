"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSiteUrl } from "@/lib/config/env";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "magic">("login");
  const [magicSent, setMagicSent] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    if (mode === "magic") {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${getSiteUrl()}/auth/callback` },
      });
      if (error) {
        setError(error.message);
      } else {
        setMagicSent(true);
      }
      setLoading(false);
      return;
    }

    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      const role = signInData.user?.user_metadata?.role || "broker";
      router.push(role === "driver" ? "/driver" : "/board");
      router.refresh();
    }
    setLoading(false);
  }

  if (magicSent) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-10 backdrop-blur-xl">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10">
              <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Check Your Email</h2>
            <p className="text-white/40 text-sm mb-6">
              We sent a magic link to <span className="text-white/70 font-medium">{email}</span>.
              Click the link to sign in.
            </p>
            <button
              onClick={() => { setMagicSent(false); setEmail(""); }}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Try a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  const [loginMode, setLoginMode] = useState<"broker" | "driver">("broker");

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/kfb-logo.png" alt="KFB" className="h-12 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">
            {loginMode === "driver" ? "Driver Portal" : "Broker Portal"}
          </h1>
          <p className="text-sm text-white/40 mt-1">
            {loginMode === "driver"
              ? "Sign in to view your assigned loads"
              : "Sign in to manage your loads and invoices"}
          </p>
        </div>

        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-xl">
          {/* Mode toggle */}
          <div className="flex gap-1 rounded-xl bg-white/[0.03] p-1 mb-6">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 rounded-lg py-2 text-[13px] font-medium transition-all ${
                mode === "login"
                  ? "bg-white/[0.08] text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Password
            </button>
            <button
              onClick={() => setMode("magic")}
              className={`flex-1 rounded-lg py-2 text-[13px] font-medium transition-all ${
                mode === "magic"
                  ? "bg-white/[0.08] text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Magic Link
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-white/50 uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="henry@kfbrokerage.com"
                required
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
            </div>

            {mode === "login" && (
              <div>
                <label className="block text-[12px] font-medium text-white/50 uppercase tracking-wider mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Signing in..."
                : mode === "magic"
                  ? "Send Magic Link"
                  : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <button
              onClick={() => setLoginMode(loginMode === "broker" ? "driver" : "broker")}
              className={`w-full flex items-center justify-center gap-2 rounded-xl border py-2.5 text-[13px] font-medium transition-all cursor-pointer ${
                loginMode === "broker"
                  ? "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                  : "border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
              }`}
            >
              {loginMode === "broker" ? (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                  Driver Login
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  Broker Login
                </>
              )}
            </button>
            <a href="/" className="block text-[13px] text-white/30 hover:text-white/50 transition-colors">
              &larr; Back to website
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
