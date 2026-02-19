"use client";

import { useState, lazy, Suspense } from "react";
import { BOLUploader } from "@/components/BOLUploader";
import { InvoicePreview } from "@/components/InvoicePreview";
import type { BolExtractedData, InvoiceData } from "@/lib/types";
import { pdf } from "@react-pdf/renderer";

// Lazy load the PDF document component to avoid SSR issues
const InvoiceDocument = lazy(() =>
  import("@/components/InvoiceDocument").then((mod) => ({ default: mod.InvoiceDocument }))
);

/** Default broker info for KFB — will be configurable per tenant later */
const DEFAULT_BROKER = {
  companyName: "Kingdom Family Brokerage, Inc.",
  address: "7533 Kingsmill Terrace",
  city: "Fort Worth",
  state: "TX",
  zip: "76112",
  phone: "(682) 231-3575",
  email: "Hlrolfe@dfwtrucking.com",
  mcNumber: "1750411",
};

function bolToInvoice(bol: BolExtractedData): InvoiceData {
  const today = new Date().toISOString().split("T")[0];
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
      pickupDate: bol.pickupDate,
      receiverName: bol.shipTo.name,
      deliverySite: `${bol.shipTo.address}${bol.shipTo.city ? `, ${bol.shipTo.city}` : ""}`,
      deliveryDate: bol.deliveryDate,
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

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [history, setHistory] = useState<InvoiceRecord[]>([]);

  const handleExtracted = (data: Record<string, unknown>) => {
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

  const saveToHistory = () => {
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
  };

  const handleReset = () => {
    // Save current invoice to history before resetting
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
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-zinc-900">Copper Asset Management</h1>
            <p className="text-xs text-zinc-500">Kingdom Family Brokerage</p>
          </div>
          {step !== "upload" && (
            <button
              onClick={handleReset}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              New Invoice
            </button>
          )}
        </div>
      </header>

      {/* Progress Steps */}
      <div className="mx-auto max-w-3xl px-4 py-4">
        <div className="flex items-center gap-2 text-xs">
          <span className={`font-medium ${step === "upload" ? "text-blue-600" : "text-zinc-400"}`}>
            1. Upload BOL
          </span>
          <span className="text-zinc-300">&rarr;</span>
          <span className={`font-medium ${step === "preview" ? "text-blue-600" : "text-zinc-400"}`}>
            2. Review Invoice
          </span>
          <span className="text-zinc-300">&rarr;</span>
          <span className={`font-medium ${step === "done" ? "text-blue-600" : "text-zinc-400"}`}>
            3. Send Invoice
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-4 pb-20">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
            <button onClick={() => setError(null)} className="ml-2 font-medium underline">
              Dismiss
            </button>
          </div>
        )}

        {step === "upload" && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-zinc-900">Upload Bill of Lading</h2>
              <p className="text-sm text-zinc-600 mt-1">
                Take a photo or upload an image of the BOL. AI will extract all the data automatically.
              </p>
            </div>
            <BOLUploader onExtracted={handleExtracted} onError={setError} />
          </div>
        )}

        {step === "preview" && invoiceData && (
          <Suspense fallback={<div className="text-center py-8 text-zinc-500">Loading preview...</div>}>
            <div className="space-y-4">
              {/* Rate input — prominent at top since this is the key field not on BOL */}
              <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
                <label className="block text-sm font-semibold text-blue-900 mb-2">
                  Shipper Rate (Linehaul)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-blue-900">$</span>
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
                    className="flex-1 rounded-lg border border-blue-300 px-4 py-2.5 text-lg font-semibold text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  Enter the rate agreed with the shipper. This is not on the BOL.
                </p>
              </div>

              <InvoicePreview data={invoiceData} onChange={setInvoiceData} />
              <button
                onClick={handleGeneratePdf}
                disabled={isGenerating}
                className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? "Generating PDF..." : "Generate Invoice PDF"}
              </button>
            </div>
          </Suspense>
        )}

        {step === "done" && pdfUrl && invoiceData && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-zinc-900">Invoice Ready</h2>
              <p className="text-sm text-zinc-600 mt-1">
                Invoice #{invoiceData.invoiceNumber} has been generated
              </p>
            </div>

            {/* PDF Preview */}
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              <iframe src={pdfUrl} className="w-full h-[600px]" title="Invoice PDF Preview" />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="flex-1 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Download PDF
              </button>
              <button
                onClick={() => setStep("preview")}
                className="rounded-lg border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Edit
              </button>
            </div>

            {/* Email Send */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
              <h3 className="text-sm font-semibold text-zinc-800">Email Invoice to Shipper</h3>
              <p className="text-xs text-zinc-500">
                Sent from invoices@copperasset.com
              </p>
              {emailSent ? (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Invoice sent to {emailTo}
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="shipper@example.com"
                    className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendEmail}
                    disabled={isSendingEmail || !emailTo}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSendingEmail ? "Sending..." : "Send"}
                  </button>
                </div>
              )}
            </div>

            {/* Process Another BOL */}
            <button
              onClick={handleReset}
              className="w-full rounded-xl border-2 border-dashed border-zinc-300 py-4 text-sm font-medium text-zinc-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
            >
              + Process Another BOL
            </button>
          </div>
        )}

        {/* Invoice History */}
        {history.length > 0 && (
          <div className="mt-10">
            <h3 className="text-sm font-semibold text-zinc-700 mb-3">
              Invoice History ({history.length})
            </h3>
            <div className="space-y-2">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-900">
                        #{record.invoiceNumber}
                      </span>
                      <span className="text-xs text-zinc-400">{record.date}</span>
                      {record.emailSentTo && (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                          Emailed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 truncate">
                      {record.shipperName} &rarr; {record.receiverName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    <span className="text-sm font-semibold text-zinc-900">
                      {formatCurrency(record.amount)}
                    </span>
                    <a
                      href={record.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-blue-600 hover:text-blue-800"
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
