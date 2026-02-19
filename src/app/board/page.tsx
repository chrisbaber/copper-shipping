"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface InvoiceRow {
  id: string;
  load_id: string;
  invoice_number: string;
  bill_to_name: string;
  total_amount: number;
  status: string;
  sent_to_email: string | null;
  created_at: string;
  loads: {
    id: string;
    shipper_name: string;
    pickup_address: string;
    delivery_address: string;
  } | null;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

export default function BoardDashboard() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInvoices = useCallback(async () => {
    try {
      const res = await fetch("/api/invoices");
      const { data } = await res.json();
      if (data && Array.isArray(data)) {
        setInvoices(data);
      }
    } catch {
      // Supabase not connected
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const totalAmount = invoices.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
  const sentCount = invoices.filter((inv) => inv.status === "sent").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invoice Board</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track all your invoices</p>
        </div>
        <Link
          href="/board/upload"
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20 cursor-pointer"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Invoice
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{invoices.length}</p>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total</p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{sentCount}</p>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Sent</p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalAmount)}</p>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Revenue</p>
        </div>
      </div>

      {/* Invoice List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <h3 className="mt-4 text-base font-semibold text-slate-700">No invoices yet</h3>
          <p className="mt-1 text-sm text-slate-500">Upload a BOL to create your first invoice</p>
          <Link
            href="/board/upload"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Upload BOL
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3.5 hover:border-slate-300 hover:shadow-sm transition-all"
            >
              {/* Status icon */}
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${
                  inv.status === "sent"
                    ? "bg-emerald-50 text-emerald-600"
                    : inv.status === "paid"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-amber-50 text-amber-600"
                }`}
              >
                {inv.status === "sent" ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                )}
              </div>

              {/* Details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    #{inv.invoice_number || "—"}
                  </span>
                  {inv.status === "sent" ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">
                      Sent
                    </span>
                  ) : inv.status === "paid" ? (
                    <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-700 uppercase tracking-wider">
                      Paid
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700 uppercase tracking-wider">
                      Draft
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {inv.bill_to_name || "—"} &middot; {(inv.created_at || "").split("T")[0]}
                </p>
              </div>

              {/* Amount + actions */}
              <div className="text-right shrink-0 flex items-center gap-3">
                <p className="text-sm font-bold text-slate-900">
                  {formatCurrency(Number(inv.total_amount) || 0)}
                </p>
                <div className="flex gap-1">
                  <Link
                    href={`/board/${inv.load_id}`}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/board/${inv.load_id}/send`}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[11px] font-medium text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    Preview
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
