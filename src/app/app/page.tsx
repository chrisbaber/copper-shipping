"use client";

import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { BOLUploader } from "@/components/BOLUploader";
import { InvoicePreview } from "@/components/InvoicePreview";
import type { BolExtractedData, InvoiceData } from "@/lib/types";
import { pdf } from "@react-pdf/renderer";

const InvoiceDocument = lazy(() =>
  import("@/components/InvoiceDocument").then((mod) => ({ default: mod.InvoiceDocument }))
);

const DEFAULT_BROKER = {
  companyName: "Kingdom Family Brokerage, Inc.",
  address: "7533 Kingsmill Terrace",
  city: "Fort Worth",
  state: "TX",
  zip: "76112",
  phone: "(682) 231-3575",
  email: "Hlrolfe@dfwtrucking.com",
  ein: "29-58805",
  mcNumber: "1750411",
  usDot: "4444213",
};

/** Convert YYYY-MM-DD to MM-DD-YYYY for display */
function toDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return `${match[2]}-${match[3]}-${match[1]}`;
  return dateStr;
}

function bolToInvoice(bol: BolExtractedData): InvoiceData {
  const now = new Date();
  const today = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${now.getFullYear()}`;
  return {
    invoiceNumber: bol.brokerLoadNumber ? `F${bol.brokerLoadNumber.replace(/\D/g, "")}` : "",
    invoiceDate: today,
    broker: { ...DEFAULT_BROKER },
    shipment: {
      brokerLoadNumber: bol.brokerLoadNumber,
      motorCarrier: bol.carrierName,
      mcAuthority: "",
      usDot: "",
      equipment: "",
      commodity: `${bol.commodity}${bol.quantity ? `, ${bol.quantity}` : ""}`,
      weight: bol.weight,
      driverName: bol.driverName,
      truckTag: bol.truckTag,
      truckNumber: bol.truckNumber,
    },
    billTo: {
      name: bol.shipFrom.name,
      address: bol.shipFrom.address,
      city: bol.shipFrom.city,
      state: bol.shipFrom.state,
      zip: bol.shipFrom.zip,
    },
    routing: {
      shipperName: bol.shipFrom.name,
      originSite: `${bol.shipFrom.address}${bol.shipFrom.city ? `, ${bol.shipFrom.city}` : ""}`,
      pickupDate: toDisplayDate(bol.pickupDate),
      receiverName: bol.shipTo.name,
      deliverySite: `${bol.shipTo.address}${bol.shipTo.city ? `, ${bol.shipTo.city}` : ""}`,
      deliveryDate: toDisplayDate(bol.deliveryDate),
      mcLoadNumber: bol.bolNumber,
    },
    charges: {
      linehaul: 0,
      fuelSurcharge: 0,
      accessorial: 0,
      totalAmountDue: 0,
    },
  };
}

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  shipperName: string;
  receiverName: string;
  amount: number;
  date: string;
  emailSentTo: string | null;
  pdfUrl: string;
}

type Step = "upload" | "preview" | "done";

const STEPS: { key: Step; label: string; icon: string }[] = [
  { key: "upload", label: "Upload BOL", icon: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" },
  { key: "preview", label: "Review", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
  { key: "done", label: "Send", icon: "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" },
];

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [extractedBolData, setExtractedBolData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [history, setHistory] = useState<InvoiceRecord[]>([]);

  // Load invoice history from Supabase on mount
  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/invoices");
      const { data } = await res.json();
      if (data && Array.isArray(data)) {
        setHistory(
          data.map((inv: Record<string, string | number | null>) => ({
            id: inv.id as string,
            invoiceNumber: inv.invoice_number as string,
            shipperName: inv.bill_to_name as string || "—",
            receiverName: "—",
            amount: Number(inv.total_amount) || 0,
            date: (inv.created_at as string)?.split("T")[0] || "",
            emailSentTo: inv.sent_to_email as string | null,
            pdfUrl: "",
          }))
        );
      }
    } catch {
      // Supabase not connected yet — use in-memory history
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const handleExtracted = (data: Record<string, unknown>) => {
    setExtractedBolData(data);
    const bolData = data as unknown as BolExtractedData;
    const invoice = bolToInvoice(bolData);
    setInvoiceData(invoice);
    setStep("preview");
    setError(null);
  };

  const handleGeneratePdf = async () => {
    if (!invoiceData) return;
    setIsGenerating(true);
    try {
      const doc = <InvoiceDocument data={invoiceData} logoUrl="/kfb-logo.png" />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      setPdfBlob(blob);
      setPdfUrl(url);
      setStep("done");
      setEmailSent(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl || !invoiceData) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `Invoice-${invoiceData.invoiceNumber}-${invoiceData.invoiceDate}.pdf`;
    a.click();
  };

  const handleSendEmail = async () => {
    if (!pdfBlob || !invoiceData || !emailTo) return;
    setIsSendingEmail(true);
    try {
      const formData = new FormData();
      formData.append("pdf", pdfBlob, `Invoice-${invoiceData.invoiceNumber}.pdf`);
      formData.append("to", emailTo);
      formData.append("invoiceNumber", invoiceData.invoiceNumber);
      formData.append("amount", invoiceData.charges.totalAmountDue.toString());
      formData.append("brokerName", invoiceData.broker.companyName);

      const response = await fetch("/api/invoice/send", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Failed to send email");
        return;
      }
      setEmailSent(true);
    } catch {
      setError("Failed to send email");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const saveToHistory = async () => {
    if (!invoiceData || !pdfUrl) return;
    const record: InvoiceRecord = {
      id: crypto.randomUUID(),
      invoiceNumber: invoiceData.invoiceNumber,
      shipperName: invoiceData.routing.shipperName,
      receiverName: invoiceData.routing.receiverName,
      amount: invoiceData.charges.totalAmountDue,
      date: invoiceData.invoiceDate,
      emailSentTo: emailSent ? emailTo : null,
      pdfUrl,
    };
    setHistory((prev) => [record, ...prev]);

    // Persist to Supabase (fire and forget)
    try {
      await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: invoiceData.invoiceNumber,
          shipperName: invoiceData.routing.shipperName,
          shipperAddress: invoiceData.routing.originSite,
          pickupAddress: invoiceData.routing.originSite,
          pickupDate: invoiceData.routing.pickupDate || null,
          deliveryAddress: invoiceData.routing.deliverySite,
          deliveryDate: invoiceData.routing.deliveryDate || null,
          commodity: invoiceData.shipment.commodity,
          weight: invoiceData.shipment.weight,
          carrierName: invoiceData.shipment.motorCarrier,
          carrierMc: invoiceData.shipment.mcAuthority,
          truckNumber: "",
          bolNumber: invoiceData.routing.mcLoadNumber,
          billToName: invoiceData.billTo.name,
          billToAddress: `${invoiceData.billTo.address}, ${invoiceData.billTo.city}, ${invoiceData.billTo.state} ${invoiceData.billTo.zip}`,
          linehaul: invoiceData.charges.linehaul,
          fuelSurcharge: invoiceData.charges.fuelSurcharge,
          accessorial: invoiceData.charges.accessorial,
          totalAmount: invoiceData.charges.totalAmountDue,
          emailSentTo: emailSent ? emailTo : null,
          extractedData: extractedBolData,
        }),
      });
    } catch {
      // Supabase not connected — local history still works
    }
  };

  const handleReset = () => {
    if (step === "done" && invoiceData && pdfUrl) {
      saveToHistory();
    }
    setStep("upload");
    setInvoiceData(null);
    setError(null);
    setPdfUrl(null);
    setPdfBlob(null);
    setIsGenerating(false);
    setEmailSent(false);
    setEmailTo("");
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
          <img
            src="/kfb-logo.png"
            alt="Kingdom Family Brokerage"
            className="h-10 w-auto object-contain"
          />
          {step !== "upload" && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Invoice
            </button>
          )}
        </div>
      </header>

      {/* Progress Stepper */}
      <div className="mx-auto max-w-3xl px-4 pt-5 pb-2">
        <div className="flex items-center">
          {STEPS.map((s, i) => {
            const isActive = i === stepIndex;
            const isComplete = i < stepIndex;
            return (
              <div key={s.key} className="flex items-center flex-1 last:flex-initial">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
                      isComplete
                        ? "bg-emerald-500 text-white"
                        : isActive
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {isComplete ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:block ${
                      isActive ? "text-blue-700" : isComplete ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="mx-3 flex-1 h-px bg-slate-200">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-500"
                      style={{ width: isComplete ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-4">
        {/* Error Banner */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4">
            <svg className="h-5 w-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Something went wrong</p>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 cursor-pointer"
              aria-label="Dismiss error"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Upload Bill of Lading
              </h2>
              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                Take a photo or upload an image of the BOL. AI will extract all fields and pre-fill your invoice.
              </p>
            </div>
            <BOLUploader onExtracted={handleExtracted} onError={setError} />

            {/* Quick stats when there's history */}
            {history.length > 0 && (
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="rounded-xl bg-white border border-slate-200 p-3 text-center">
                  <p className="text-2xl font-bold text-slate-900">{history.length}</p>
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Invoices</p>
                </div>
                <div className="rounded-xl bg-white border border-slate-200 p-3 text-center">
                  <p className="text-2xl font-bold text-slate-900">
                    {history.filter((h) => h.emailSentTo).length}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Emailed</p>
                </div>
                <div className="rounded-xl bg-white border border-slate-200 p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(history.reduce((sum, h) => sum + h.amount, 0))}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Preview / Edit */}
        {step === "preview" && invoiceData && (
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
              </div>
            }
          >
            <div className="space-y-5">
              {/* Rate input card */}
              <div className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white shadow-lg shadow-blue-600/20">
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Shipper Rate (Linehaul)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">$</span>
                  <input
                    type="number"
                    value={invoiceData.charges.linehaul || ""}
                    onChange={(e) => {
                      const rate = Number.parseFloat(e.target.value) || 0;
                      setInvoiceData({
                        ...invoiceData,
                        charges: {
                          ...invoiceData.charges,
                          linehaul: rate,
                          totalAmountDue: rate + invoiceData.charges.fuelSurcharge + invoiceData.charges.accessorial,
                        },
                      });
                    }}
                    placeholder="640.00"
                    className="flex-1 rounded-lg bg-white/15 border border-white/30 px-4 py-3 text-2xl font-bold text-white placeholder-blue-200 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <p className="text-xs text-blue-200 mt-2">
                  Enter the rate agreed with the shipper. This is not on the BOL.
                </p>
              </div>

              <InvoicePreview data={invoiceData} onChange={setInvoiceData} />

              <button
                onClick={handleGeneratePdf}
                disabled={isGenerating}
                className="w-full rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm shadow-blue-600/20 hover:shadow-md hover:shadow-blue-600/25 cursor-pointer"
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating PDF...
                  </span>
                ) : (
                  "Generate Invoice PDF"
                )}
              </button>
            </div>
          </Suspense>
        )}

        {/* Step 3: Done */}
        {step === "done" && pdfUrl && invoiceData && (
          <div className="space-y-5">
            {/* Success banner */}
            <div className="flex items-center gap-4 rounded-xl bg-emerald-50 border border-emerald-200 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 shrink-0">
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-emerald-900">Invoice Ready</h2>
                <p className="text-sm text-emerald-700">
                  #{invoiceData.invoiceNumber} &middot; {formatCurrency(invoiceData.charges.totalAmountDue)}
                </p>
              </div>
            </div>

            {/* PDF Preview */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <iframe src={pdfUrl} className="w-full h-[400px] sm:h-[500px]" title="Invoice PDF Preview" />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download PDF
              </button>
              <button
                onClick={() => setStep("preview")}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
                Edit
              </button>
            </div>

            {/* Email Send Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <h3 className="text-sm font-semibold text-slate-800">Email Invoice</h3>
              </div>
              {emailSent ? (
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Sent to {emailTo}
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="shipper@example.com"
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    onClick={handleSendEmail}
                    disabled={isSendingEmail || !emailTo}
                    className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    {isSendingEmail ? (
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      "Send"
                    )}
                  </button>
                </div>
              )}
              <p className="text-[11px] text-slate-400">
                From: invoice@copperasset.com
              </p>
            </div>

            {/* Process Another */}
            <button
              onClick={handleReset}
              className="w-full rounded-xl border-2 border-dashed border-slate-300 py-4 text-sm font-medium text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
            >
              + Process Another BOL
            </button>
          </div>
        )}

        {/* Invoice History */}
        {history.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Recent Invoices
              </h3>
              <span className="text-xs font-medium text-slate-400">
                {history.length} total
              </span>
            </div>
            <div className="space-y-2">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3.5 hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  {/* Status icon */}
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${
                      record.emailSentTo
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    {record.emailSentTo ? (
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
                        #{record.invoiceNumber}
                      </span>
                      {record.emailSentTo ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">
                          Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700 uppercase tracking-wider">
                          Draft
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {record.shipperName} &rarr; {record.receiverName}
                    </p>
                  </div>

                  {/* Amount + action */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-900">
                      {formatCurrency(record.amount)}
                    </p>
                    <a
                      href={record.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      View PDF
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
