"use client";

import { useEffect, useState } from "react";

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  mc_number: string | null;
  dot_number: string | null;
  truck_number: string | null;
  truck_tag: string | null;
  equipment: string | null;
  created_at: string;
}

interface Invitation {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  state: string;
  created_at: string;
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: "", email: "", phone: "", mcNumber: "", dotNumber: "", truckNumber: "", truckTag: "", equipment: "",
  });
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  async function loadDrivers() {
    try {
      const res = await fetch("/api/drivers");
      if (res.ok) {
        const data = await res.json();
        setDrivers(data.drivers || []);
        setInvitations(data.invitations || []);
      }
    } catch {
      // Failed
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDrivers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteError(null);
    try {
      const res = await fetch("/api/drivers/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });
      if (res.ok) {
        setInviteSuccess(true);
        setInviteForm({ name: "", email: "", phone: "", mcNumber: "", dotNumber: "", truckNumber: "", truckTag: "", equipment: "" });
        setTimeout(() => { setInviteSuccess(false); setShowInvite(false); }, 2000);
        loadDrivers();
      } else {
        const { error } = await res.json();
        setInviteError(error || "Failed to send invite");
      }
    } catch {
      setInviteError("Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Drivers</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your drivers and send invitations</p>
        </div>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 transition-colors shadow-sm shadow-amber-600/20 cursor-pointer"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Invite Driver
        </button>
      </div>

      {/* Invite Form */}
      {showInvite && (
        <form onSubmit={handleInvite} className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">Invite New Driver</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
              <input
                type="text" required value={inviteForm.name}
                onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
              <input
                type="email" required value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="driver@email.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
              <input
                type="tel" value={inviteForm.phone}
                onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="(555) 555-5555"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">MC Number</label>
              <input
                type="text" value={inviteForm.mcNumber}
                onChange={(e) => setInviteForm({ ...inviteForm, mcNumber: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="123456"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">DOT Number</label>
              <input
                type="text" value={inviteForm.dotNumber}
                onChange={(e) => setInviteForm({ ...inviteForm, dotNumber: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="1234567"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Truck Number</label>
              <input
                type="text" value={inviteForm.truckNumber}
                onChange={(e) => setInviteForm({ ...inviteForm, truckNumber: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="T-5678"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Truck Tag</label>
              <input
                type="text" value={inviteForm.truckTag}
                onChange={(e) => setInviteForm({ ...inviteForm, truckTag: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="TX ABC-1234"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Equipment</label>
              <input
                type="text" value={inviteForm.equipment}
                onChange={(e) => setInviteForm({ ...inviteForm, equipment: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="53' Dry Van"
              />
            </div>
          </div>

          {inviteError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">{inviteError}</div>
          )}

          {inviteSuccess && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-700 flex items-center gap-2">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Invitation sent!
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit" disabled={inviting}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {inviting ? "Sending..." : "Send Invitation"}
            </button>
            <button
              type="button" onClick={() => setShowInvite(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Driver List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-amber-600" />
        </div>
      ) : drivers.length === 0 && invitations.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          <h3 className="mt-4 text-base font-semibold text-slate-700">No drivers yet</h3>
          <p className="mt-1 text-sm text-slate-500">Invite your first driver to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Active Drivers */}
          {drivers.map((driver) => (
            <div
              key={driver.id}
              className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3.5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 shrink-0">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{driver.name}</span>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {driver.email}
                  {driver.truck_number && ` · Truck #${driver.truck_number}`}
                  {driver.mc_number && ` · MC-${driver.mc_number}`}
                </p>
              </div>
            </div>
          ))}

          {/* Pending Invitations */}
          {invitations.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center gap-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-3.5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400 shrink-0">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-600">{inv.name}</span>
                  <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700 uppercase tracking-wider">
                    Invite Pending
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {inv.email} · Sent {new Date(inv.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
