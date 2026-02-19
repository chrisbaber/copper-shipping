"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { InvoiceDocument } from "@/components/InvoiceDocument";
import type { InvoiceData } from "@/lib/types";
import { pdf } from "@react-pdf/renderer";

interface Settings {
  companyName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  ein: string;
  mcNumber: string;
  usDot: string;
  bankName: string;
  bankAccount: string;
  bankRouting: string;
  submittedBy: string;
  contactPhone: string;
  contactEmail: string;
  logoUrl?: string;
}

const EMPTY_SETTINGS: Settings = {
  companyName: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  phone: "",
  email: "",
  ein: "",
  mcNumber: "",
  usDot: "",
  bankName: "",
  bankAccount: "",
  bankRouting: "",
  submittedBy: "",
  contactPhone: "",
  contactEmail: "",
};

function buildSampleInvoice(s: Settings): InvoiceData {
  const now = new Date();
  const today = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${now.getFullYear()}`;

  return {
    invoiceNumber: "SAMPLE-001",
    invoiceDate: today,
    broker: {
      companyName: s.companyName || "Your Company Name",
      address: s.address || "123 Business Ave",
      city: s.city || "City",
      state: s.state || "ST",
      zip: s.zip || "00000",
      phone: s.phone || "(000) 000-0000",
      email: s.email || "email@example.com",
      ein: s.ein || "00-0000000",
      mcNumber: s.mcNumber || "0000000",
      usDot: s.usDot || "0000000",
      bankName: s.bankName || "Bank Name",
      bankAccount: s.bankAccount || "000000000000",
      bankRouting: s.bankRouting || "000 000 000",
      submittedBy: s.submittedBy || "Your Name",
      contactPhone: s.contactPhone || "(000) 000-0000",
      contactEmail: s.contactEmail || "email@example.com",
    },
    shipment: {
      brokerLoadNumber: "KFB #10000",
      motorCarrier: "ABC Trucking Co.",
      mcAuthority: "MC-123456",
      usDot: "1234567",
      equipment: "53' Dry Van",
      commodity: "General Freight, 20 pallets",
      weight: "40,000 lbs",
      driverName: "John Doe",
      truckTag: "TX ABC-1234",
      truckNumber: "T-5678",
    },
    billTo: {
      name: "Sample Shipper Co.",
      address: "123 Main Street",
      city: "Dallas",
      state: "TX",
      zip: "75201",
    },
    routing: {
      shipperName: "Sample Shipper Co.",
      originSite: "123 Main St, Dallas, TX",
      pickupDate: "01-15-2026",
      receiverName: "Sample Receiver Inc.",
      deliverySite: "456 Oak Ave, Houston, TX",
      deliveryDate: "01-16-2026",
      mcLoadNumber: "BOL-00001",
    },
    charges: {
      linehaul: 1500.0,
      fuelSurcharge: 150.0,
      accessorial: 0,
      totalAmountDue: 1650.0,
    },
  };
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
      />
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings");
        const { data } = await res.json();
        if (data) setSettings(data);
      } catch {
        // Fall back to empty
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Debounced PDF preview generation
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(async () => {
      try {
        const sampleData = buildSampleInvoice(settings);
        const doc = <InvoiceDocument data={sampleData} logoUrl="/kfb-logo.png" />;
        const blob = await pdf(doc).toBlob();
        const url = URL.createObjectURL(blob);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } catch {
        // PDF gen failed silently
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [settings, loading]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const { error: msg } = await res.json();
        setError(msg || "Failed to save settings");
      }
    } catch {
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof Settings) => (value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Company info, payment details, and invoice template</p>
        </div>
        <button
          onClick={() => router.push("/board")}
          className="text-xs font-medium text-slate-500 hover:text-slate-700 cursor-pointer"
        >
          &larr; Dashboard
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Form */}
        <div className="flex-1 space-y-5 min-w-0">
          {/* Company Information */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
              Company Information
            </h3>
            <InputField label="Company Name" value={settings.companyName} onChange={update("companyName")} placeholder="Kingdom Family Brokerage, Inc." />
            <InputField label="Street Address" value={settings.address} onChange={update("address")} placeholder="7533 Kingsmill Terrace" />
            <div className="grid grid-cols-3 gap-3">
              <InputField label="City" value={settings.city} onChange={update("city")} placeholder="Fort Worth" />
              <InputField label="State" value={settings.state} onChange={update("state")} placeholder="TX" />
              <InputField label="ZIP" value={settings.zip} onChange={update("zip")} placeholder="76112" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Phone" value={settings.phone} onChange={update("phone")} placeholder="(682) 231-3575" type="tel" />
              <InputField label="Email" value={settings.email} onChange={update("email")} placeholder="email@example.com" type="email" />
            </div>
          </div>

          {/* Regulatory Numbers */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
              Regulatory Numbers
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <InputField label="EIN" value={settings.ein} onChange={update("ein")} placeholder="29-58805" />
              <InputField label="MC Number" value={settings.mcNumber} onChange={update("mcNumber")} placeholder="1750411" />
              <InputField label="US DOT" value={settings.usDot} onChange={update("usDot")} placeholder="4444213" />
            </div>
          </div>

          {/* Payment Instructions */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
              Payment Instructions
            </h3>
            <InputField label="Bank Name" value={settings.bankName} onChange={update("bankName")} placeholder="Bank of America" />
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Account Number" value={settings.bankAccount} onChange={update("bankAccount")} placeholder="488135011117" />
              <InputField label="Routing Number" value={settings.bankRouting} onChange={update("bankRouting")} placeholder="111 000 025" />
            </div>
          </div>

          {/* Contact & Submission */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              Contact & Submission
            </h3>
            <InputField label="Submitted By" value={settings.submittedBy} onChange={update("submittedBy")} placeholder="Henry L Wolfe" />
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Contact Phone" value={settings.contactPhone} onChange={update("contactPhone")} placeholder="(682) 231-3575" type="tel" />
              <InputField label="Contact Email" value={settings.contactEmail} onChange={update("contactEmail")} placeholder="email@example.com" type="email" />
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
          )}

          {saved && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700 flex items-center gap-2">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Settings saved successfully
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-blue-600/20 cursor-pointer"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </span>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>

        {/* Live Preview — desktop only */}
        <div className="hidden lg:block w-[420px] shrink-0">
          <div className="sticky top-20">
            <div className="flex items-center gap-2 mb-3">
              <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="text-sm font-semibold text-slate-800">Invoice Preview</h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Live preview with sample data — your settings applied
            </p>
            {previewUrl ? (
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <iframe src={previewUrl} className="w-full h-[700px]" title="Invoice Preview" />
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white h-[700px] flex items-center justify-center">
                <div className="text-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 mx-auto" />
                  <p className="text-xs text-slate-500 mt-3">Generating preview...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
