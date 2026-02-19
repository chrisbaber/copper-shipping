"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface DriverLoad {
  id: string;
  load_number: string;
  status: string;
  shipper_name: string | null;
  pickup_address: string | null;
  pickup_date: string | null;
  delivery_address: string | null;
  delivery_date: string | null;
  commodity: string | null;
  tendered_at: string | null;
  accepted_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; action?: string; actionLabel?: string; actionColor?: string }> = {
  tendered: {
    label: "Pending",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    action: "accept",
    actionLabel: "Accept Load",
    actionColor: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20",
  },
  accepted: {
    label: "Accepted",
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    action: "pickup",
    actionLabel: "Pick Up",
    actionColor: "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20",
  },
  in_transit: {
    label: "In Transit",
    bg: "bg-indigo-50 border-indigo-200",
    text: "text-indigo-700",
    action: "dropoff",
    actionLabel: "Drop Off",
    actionColor: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20",
  },
  delivered: {
    label: "Delivered",
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
  },
  invoiced: {
    label: "Invoiced",
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
  },
  paid: {
    label: "Paid",
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
  },
};

const STATUS_ORDER = ["tendered", "accepted", "in_transit", "delivered", "invoiced", "paid"];

export default function DriverDashboard() {
  const [loads, setLoads] = useState<DriverLoad[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [userName, setUserName] = useState("");

  const loadData = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserName(user.user_metadata?.name || user.email || "Driver");

      const res = await fetch(`/api/drivers/loads?userId=${user.id}`);
      if (res.ok) {
        const { data } = await res.json();
        setLoads(data || []);
      }
    } catch {
      // Failed to load
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAction = async (loadId: string, action: string) => {
    setActionLoading(loadId);
    try {
      const res = await fetch(`/api/loads/${loadId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await loadData();
      }
    } catch {
      // Failed
    } finally {
      setActionLoading(null);
    }
  };

  const sortedLoads = [...loads].sort(
    (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
  );

  const activeCount = loads.filter((l) => ["tendered", "accepted", "in_transit"].includes(l.status)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Loads</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome back, {userName}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{loads.length}</p>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total</p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{activeCount}</p>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Active</p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{loads.filter((l) => l.status === "delivered").length}</p>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Delivered</p>
        </div>
      </div>

      {/* Load List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-amber-600" />
        </div>
      ) : sortedLoads.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
          <h3 className="mt-4 text-base font-semibold text-slate-700">No loads assigned</h3>
          <p className="mt-1 text-sm text-slate-500">Your broker will assign loads to you here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedLoads.map((load) => {
            const config = STATUS_CONFIG[load.status] || STATUS_CONFIG.delivered;
            const isActioning = actionLoading === load.id;

            return (
              <div
                key={load.id}
                className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"
              >
                {/* Top row: load number + status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">
                    #{load.load_number}
                  </span>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${config.bg} ${config.text}`}>
                    {config.label}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1.5">
                  {load.shipper_name && (
                    <p className="text-xs text-slate-600">
                      <span className="text-slate-400">Shipper:</span> {load.shipper_name}
                    </p>
                  )}
                  {load.pickup_address && (
                    <p className="text-xs text-slate-600">
                      <span className="text-slate-400">Pickup:</span> {load.pickup_address}
                      {load.pickup_date && ` · ${load.pickup_date}`}
                    </p>
                  )}
                  {load.delivery_address && (
                    <p className="text-xs text-slate-600">
                      <span className="text-slate-400">Delivery:</span> {load.delivery_address}
                      {load.delivery_date && ` · ${load.delivery_date}`}
                    </p>
                  )}
                  {load.commodity && (
                    <p className="text-xs text-slate-600">
                      <span className="text-slate-400">Commodity:</span> {load.commodity}
                    </p>
                  )}
                </div>

                {/* Action button */}
                {config.action && (
                  <button
                    onClick={() => handleAction(load.id, config.action!)}
                    disabled={isActioning}
                    className={`w-full rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${config.actionColor}`}
                  >
                    {isActioning ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Updating...
                      </span>
                    ) : (
                      config.actionLabel
                    )}
                  </button>
                )}

                {/* Completed indicator */}
                {!config.action && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-200">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Delivered{load.delivered_at ? ` · ${new Date(load.delivered_at).toLocaleDateString()}` : ""}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
