"use client";

import { useState } from "react";
import Link from "next/link";
import { ParticleTunnelLoader } from "@/components/three/ParticleTunnelLoader";

const NAV_LINKS = [
  { href: "#services", label: "Services" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#about", label: "About" },
  { href: "#academy", label: "Academy" },
  { href: "#contact", label: "Contact" },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/kfb-logo.png" alt="KFB" className="h-8 sm:h-9 w-auto" />
            <span className="text-sm font-bold tracking-tight text-white/90 hidden sm:block">
              Kingdom Family Brokerage
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-white/50">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-white transition-colors">
                {link.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="text-[13px] font-medium text-white/60 hover:text-white transition-colors hidden sm:block"
            >
              Portal Login
            </Link>
            <a
              href="#contact"
              className="rounded-full bg-white px-4 sm:px-5 py-2 text-[12px] sm:text-[13px] font-semibold text-[#0a0a0f] hover:bg-white/90 transition-colors"
            >
              Get a Quote
            </a>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/[0.06] bg-[#0a0a0f]/95 backdrop-blur-xl">
            <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="border-t border-white/[0.06] mt-2 pt-3">
                <Link
                  href="/login"
                  className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-blue-400 hover:bg-white/[0.04] transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  Portal Login
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6">
        {/* 3D Particle tunnel background */}
        <ParticleTunnelLoader />
        {/* Fallback gradient orbs (visible while Three.js loads) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-20 pointer-events-none">
          <div className="absolute top-20 left-0 w-96 h-96 bg-blue-600 rounded-full blur-[128px]" />
          <div className="absolute top-40 right-0 w-80 h-80 bg-indigo-500 rounded-full blur-[128px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-[12px] font-medium text-white/50 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Serving the DFW Metroplex &amp; Beyond
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            Your Freight.{" "}
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">
              Our Expertise.
            </span>
            <br />
            Delivered On Time.
          </h1>

          <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed mb-10">
            Kingdom Family Brokerage connects shippers with reliable carriers across Texas
            and beyond. Asset-based trucking, expert brokerage, and freight agent training — all under one roof.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#contact"
              className="group relative rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
            >
              Request a Quote
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">&rarr;</span>
            </a>
            <a
              href="#services"
              className="rounded-full border border-white/15 px-8 py-3.5 text-sm font-medium text-white/70 hover:text-white hover:border-white/30 hover:bg-white/[0.03] transition-all"
            >
              Our Services
            </a>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 mx-auto max-w-3xl mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: "MC# 1750411", label: "Licensed & Bonded" },
            { value: "7+", label: "Carrier Partners" },
            { value: "50+", label: "Active Clients" },
            { value: "500+", label: "Loads per Year" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center backdrop-blur-sm"
            >
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-[11px] font-medium text-white/40 uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services — Bento Grid */}
      <section id="services" className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-[12px] font-semibold text-blue-400 uppercase tracking-widest mb-3">What We Do</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Full-Service Freight Solutions
            </h2>
            <p className="text-white/40 mt-4 max-w-xl mx-auto">
              From local hauls to cross-state delivery, we handle every aspect of your freight logistics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Large card — Freight Brokerage */}
            <div className="md:col-span-2 group rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent p-8 hover:border-white/[0.12] transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 mb-6">
                <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v1.5" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Freight Brokerage</h3>
              <p className="text-white/40 leading-relaxed">
                We match your shipments with vetted, reliable carriers. Our network of trusted drivers covers
                dry van, flatbed, and specialty equipment across Texas and the southern United States.
                You focus on your business — we handle the logistics.
              </p>
            </div>

            {/* Asset-based trucking */}
            <div className="group rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent p-8 hover:border-white/[0.12] transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 mb-6">
                <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Own-Asset Trucking</h3>
              <p className="text-white/40 leading-relaxed">
                We operate our own fleet. That means guaranteed capacity when you need it most, and the
                credibility of an asset-based carrier behind every commitment.
              </p>
            </div>

            {/* Construction Materials */}
            <div className="group rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent p-8 hover:border-white/[0.12] transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 mb-6">
                <svg className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Construction &amp; Materials</h3>
              <p className="text-white/40 leading-relaxed">
                Specialized in hauling construction materials — sand, rebar, roofing supplies, and heavy
                equipment. We know that one delayed load can hold up an entire project.
              </p>
            </div>

            {/* Regional Coverage */}
            <div className="md:col-span-2 group rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent p-8 hover:border-white/[0.12] transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 mb-6">
                <svg className="h-6 w-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Texas &amp; Regional Coverage</h3>
              <p className="text-white/40 leading-relaxed">
                Based in Fort Worth, we cover the entire DFW metroplex and run freight across Texas and the
                southern states. Local knowledge, regional reach, and the relationships that make it all work.
                Whether it's Emory to Fort Worth or San Antonio to Dallas — we've got you covered.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.03] to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-[12px] font-semibold text-blue-400 uppercase tracking-widest mb-3">Simple Process</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              How It Works
            </h2>
            <p className="text-white/40 mt-4 max-w-xl mx-auto">
              Getting your freight moved shouldn't be complicated. Here's how we make it easy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Tell Us What You Need",
                description: "Call us or submit a quote request. Share your pickup location, destination, commodity, and timeline. We'll handle the rest.",
                icon: "M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z",
              },
              {
                step: "02",
                title: "We Find Your Carrier",
                description: "Our dispatch team matches your load with a vetted carrier from our trusted network. You'll get a rate confirmation and driver details before pickup.",
                icon: "M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z",
              },
              {
                step: "03",
                title: "Track &amp; Deliver",
                description: "Follow your shipment in real time. We coordinate pickup, transit, and delivery — plus handle all documentation and invoicing.",
                icon: "M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z",
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] mb-6">
                  <svg className="h-7 w-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mb-2">{item.step}</p>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About / Why KFB */}
      <section id="about" className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[12px] font-semibold text-blue-400 uppercase tracking-widest mb-3">Why Kingdom Family</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
                More Than a Broker.{" "}
                <span className="text-white/40">A Partner.</span>
              </h2>
              <p className="text-white/50 leading-relaxed mb-6">
                At Kingdom Family Brokerage, we believe freight should move as reliably as the relationships
                behind it. Founded in Fort Worth, Texas, we combine the trust of a family-run business with
                the capacity of an asset-based carrier and a growing network of vetted freight agents.
              </p>
              <p className="text-white/50 leading-relaxed mb-8">
                Our founder, Henry Rolfe, has built KFB on a simple principle: every load matters, every
                customer is a partner, and every driver is part of the family. That's why we don't just
                move freight — we build relationships that last.
              </p>
              <div className="flex flex-wrap gap-3">
                {["Licensed & Bonded", "FMCSA Authorized", "Asset-Based", "24/7 Dispatch"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-[12px] font-medium text-white/50"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "94%", label: "On-Time Delivery", color: "from-blue-500/20 to-blue-500/5" },
                { value: "50+", label: "Active Shippers", color: "from-emerald-500/20 to-emerald-500/5" },
                { value: "DFW", label: "Based in Fort Worth, TX", color: "from-violet-500/20 to-violet-500/5" },
                { value: "24/7", label: "Dispatch Available", color: "from-amber-500/20 to-amber-500/5" },
              ].map((card) => (
                <div
                  key={card.label}
                  className={`rounded-2xl bg-gradient-to-br ${card.color} border border-white/[0.06] p-6`}
                >
                  <p className="text-3xl font-bold">{card.value}</p>
                  <p className="text-[11px] font-medium text-white/40 uppercase tracking-wider mt-2">{card.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/[0.02] to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-5xl text-center">
          <p className="text-[12px] font-semibold text-blue-400 uppercase tracking-widest mb-3">Industries We Serve</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
            Built for Businesses That Build
          </h2>
          <p className="text-white/40 max-w-xl mx-auto mb-12">
            We specialize in the industries that keep Texas growing — from construction sites to manufacturing floors.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {[
              { name: "Construction", icon: "M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" },
              { name: "Manufacturing", icon: "M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" },
              { name: "Roofing", icon: "M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" },
              { name: "Materials", icon: "M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" },
              { name: "General", icon: "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v1.5" },
            ].map((industry) => (
              <div
                key={industry.name}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center hover:border-white/[0.12] hover:bg-white/[0.04] transition-all"
              >
                <svg className="h-6 w-6 text-white/30 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={industry.icon} />
                </svg>
                <p className="text-[13px] font-semibold text-white/60">{industry.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Academy */}
      <section id="academy" className="py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-white/[0.06] bg-gradient-to-br from-blue-500/[0.08] via-indigo-500/[0.04] to-transparent p-8 sm:p-12 relative overflow-hidden">
            {/* Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500 rounded-full blur-[120px] opacity-10 pointer-events-none" />

            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 text-[12px] font-semibold text-blue-400 mb-6">
                  Now Enrolling
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                  KFB Freight Broker Academy
                </h2>
                <p className="text-white/50 leading-relaxed mb-6">
                  Learn the freight brokerage business from someone who does it every day. Our hands-on
                  training program covers everything from getting your authority and building shipper
                  relationships to dispatching loads and managing carriers.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Full-week intensive training program",
                    "Real-world load brokering exercises",
                    "Business setup: authority, bonding, compliance",
                    "Carrier negotiation & relationship building",
                    "Technology tools & dispatch systems",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-white/50">
                      <svg className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0a0a0f] hover:bg-white/90 transition-colors"
                >
                  Inquire About Enrollment
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                  </svg>
                </a>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
                  <p className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    $1,500
                  </p>
                  <p className="text-sm text-white/40 mt-1">Per student enrollment</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                    <p className="text-2xl font-bold">15-18</p>
                    <p className="text-[11px] text-white/40 uppercase tracking-wider mt-1">Students / Class</p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                    <p className="text-2xl font-bold">100%</p>
                    <p className="text-[11px] text-white/40 uppercase tracking-wider mt-1">Hands-On</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                  <p className="text-sm text-white/60 italic leading-relaxed">
                    &ldquo;My thing is not trucks. My thing is freight agents. I'm trying to put a lot
                    of training and focus on the people I'm training so I can put them out there.&rdquo;
                  </p>
                  <p className="text-[12px] text-white/30 mt-3">— Henry Rolfe, Founder</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA / Contact */}
      <section id="contact" className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-500/[0.05] to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Ready to Move Your Freight?
          </h2>
          <p className="text-white/40 max-w-lg mx-auto mb-10">
            Get in touch today for a quote. Whether you need one truck or a fleet, we have the capacity
            and the relationships to get it done.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <a
              href="tel:+19726237139"
              className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center hover:border-white/[0.12] hover:bg-white/[0.04] transition-all"
            >
              <svg className="h-6 w-6 text-blue-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              <p className="text-sm font-semibold">(972) 623-7139</p>
              <p className="text-[11px] text-white/30 mt-1">Call or Text</p>
            </a>
            <a
              href="mailto:kfbrokerage@mail.com"
              className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center hover:border-white/[0.12] hover:bg-white/[0.04] transition-all"
            >
              <svg className="h-6 w-6 text-blue-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <p className="text-sm font-semibold">kfbrokerage@mail.com</p>
              <p className="text-[11px] text-white/30 mt-1">Email Us</p>
            </a>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
              <svg className="h-6 w-6 text-blue-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <p className="text-sm font-semibold">Fort Worth, TX</p>
              <p className="text-[11px] text-white/30 mt-1">DFW Metroplex</p>
            </div>
          </div>

          <a
            href="mailto:kfbrokerage@mail.com?subject=Quote%20Request"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
          >
            Request a Quote
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
            </svg>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-12 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src="/kfb-logo.png" alt="KFB" className="h-8 w-auto opacity-60" />
              <div>
                <p className="text-sm font-semibold text-white/60">Kingdom Family Brokerage, Inc.</p>
                <p className="text-[11px] text-white/30">MC# 1750411 &middot; Fort Worth, Texas</p>
              </div>
            </div>
            <p className="text-[12px] text-white/20">
              Thank you for selecting Kingdom Family Brokerage for your logistical needs.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
