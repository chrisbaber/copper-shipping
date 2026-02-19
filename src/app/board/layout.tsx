"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BoardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
          <Link href="/board" className="shrink-0">
            <img
              src="/kfb-logo.png"
              alt="Kingdom Family Brokerage"
              className="h-10 w-auto object-contain"
            />
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/board"
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                pathname === "/board"
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/board/drivers"
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                pathname === "/board/drivers"
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              Drivers
            </Link>
            <Link
              href="/board/upload"
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                pathname === "/board/upload"
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              Upload BOL
            </Link>
          </nav>
        </div>
      </header>
      <main className={`mx-auto ${pathname?.startsWith("/board/settings") ? "max-w-5xl" : "max-w-3xl"} px-4 pb-24 pt-6`}>{children}</main>
    </div>
  );
}
