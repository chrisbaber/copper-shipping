"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface InviteData {
  name: string;
  email: string;
  phone: string | null;
  mcNumber: string | null;
  dotNumber: string | null;
  truckNumber: string | null;
  truckTag: string | null;
  equipment: string | null;
}

export default function InviteSignupPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Editable form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [mcNumber, setMcNumber] = useState("");
  const [dotNumber, setDotNumber] = useState("");
  const [truckNumber, setTruckNumber] = useState("");
  const [truckTag, setTruckTag] = useState("");
  const [equipment, setEquipment] = useState("");

  useEffect(() => {
    async function validate() {
      try {
        const res = await fetch(`/api/drivers/invite/validate?token=${token}`);
        if (!res.ok) {
          const { error: msg } = await res.json();
          setError(msg || "Invalid invitation");
          setLoading(false);
          return;
        }
        const { data } = await res.json();
        setInvite(data);
        setName(data.name || "");
        setPhone(data.phone || "");
        setMcNumber(data.mcNumber || "");
        setDotNumber(data.dotNumber || "");
        setTruckNumber(data.truckNumber || "");
        setTruckTag(data.truckTag || "");
        setEquipment(data.equipment || "");
      } catch {
        setError("Failed to validate invitation");
      } finally {
        setLoading(false);
      }
    }
    validate();
  }, [token]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite) return;
    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();

      // Sign up with Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: invite.email,
        password,
        options: {
          data: { role: "driver", name },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setSubmitting(false);
        return;
      }

      const userId = signUpData.user?.id;
      if (!userId) {
        setError("Failed to create account");
        setSubmitting(false);
        return;
      }

      // Accept the invitation (creates profile, sets role)
      const acceptRes = await fetch("/api/drivers/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, userId }),
      });

      if (!acceptRes.ok) {
        const { error: acceptError } = await acceptRes.json();
        setError(acceptError || "Failed to accept invitation");
        setSubmitting(false);
        return;
      }

      // Sign in immediately
      await supabase.auth.signInWithPassword({
        email: invite.email,
        password,
      });

      router.push("/driver");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-amber-500" />
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl border border-white/[0.06] bg-white/[0.02] p-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
            <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Invalid Invitation</h2>
          <p className="text-white/40 text-sm">{error}</p>
          <a href="/login" className="inline-block mt-6 text-sm text-amber-400 hover:text-amber-300">
            Go to Login &rarr;
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <img src="/kfb-logo.png" alt="KFB" className="h-12 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Join as Driver</h1>
          <p className="text-sm text-white/40 mt-1">
            Complete your profile to start receiving loads
          </p>
        </div>

        <form onSubmit={handleSignup} className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-xl space-y-5">
          {/* Email (read-only) */}
          <div>
            <label className="block text-[12px] font-medium text-white/50 uppercase tracking-wider mb-2">Email</label>
            <input
              type="email"
              value={invite?.email || ""}
              readOnly
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white/60 cursor-not-allowed"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[12px] font-medium text-white/50 uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
              minLength={6}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-[12px] font-medium text-white/50 uppercase tracking-wider mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[12px] font-medium text-white/50 uppercase tracking-wider mb-2">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 555-5555"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
            />
          </div>

          {/* Truck Info */}
          <div className="pt-2 border-t border-white/[0.06]">
            <p className="text-[11px] font-medium text-white/30 uppercase tracking-wider mb-3">Vehicle Information</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-white/40 mb-1">MC Number</label>
                <input
                  type="text" value={mcNumber} onChange={(e) => setMcNumber(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-[11px] text-white/40 mb-1">DOT Number</label>
                <input
                  type="text" value={dotNumber} onChange={(e) => setDotNumber(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Truck Number</label>
                <input
                  type="text" value={truckNumber} onChange={(e) => setTruckNumber(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Truck Tag</label>
                <input
                  type="text" value={truckTag} onChange={(e) => setTruckTag(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-[11px] text-white/40 mb-1">Equipment</label>
              <input
                type="text" value={equipment} onChange={(e) => setEquipment(e.target.value)}
                placeholder="53' Dry Van"
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? "Creating Account..." : "Create Account & Join"}
          </button>

          <p className="text-center text-[12px] text-white/30">
            Already have an account?{" "}
            <a href="/login" className="text-amber-400 hover:text-amber-300">Sign in</a>
          </p>
        </form>
      </div>
    </div>
  );
}
