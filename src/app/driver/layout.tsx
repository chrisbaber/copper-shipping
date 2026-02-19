"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <header className="sticky top-0 z-30 border-b border-amber-200/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
          <Link href="/driver" className="shrink-0 flex items-center gap-2.5">
            <img
              src="/kfb-logo.png"
              alt="Kingdom Family Brokerage"
              className="h-10 w-auto object-contain"
            />
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              Driver
            </span>
          </Link>
          <button
            onClick={handleSignOut}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">{children}</main>
    </div>
  );
}
