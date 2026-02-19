"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { InvoiceDocument } from "@/components/InvoiceDocument";
import type { InvoiceData } from "@/lib/types";
import { pdf } from "@react-pdf/renderer";
import { getDefaultSettings, type BrokerSettings } from "@/lib/broker-defaults";

function toDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return `${match[2]}-${match[3]}-${match[1]}`;
  return dateStr;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

export default function SendPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailTo, setEmailTo] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    async function loadAndGenerate() {
      try {
        const [res, settingsRes] = await Promise.all([
          fetch(`/api/invoices/${id}`),
          fetch("/api/settings"),
        ]);
        if (!res.ok) {
          setError("Load not found");
          setLoading(false);
          return;
        }
        const { data } = await res.json();
        const { load, invoice, documents } = data;
        const brokerSettings = settingsRes.ok ? (await settingsRes.json()).data as BrokerSettings : null;

        const bolDoc = documents?.find((d: Record<string, unknown>) => d.type === "bol");
        const extracted = bolDoc?.extracted_data as Record<string, unknown> | null;

        const now = new Date();
        const today = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${now.getFullYear()}`;

        const invData: InvoiceData = {
          invoiceNumber: (invoice?.invoice_number as string) || (load.load_number as string) || "",
          invoiceDate: today,
          broker: brokerSettings ? { ...brokerSettings } : { ...getDefaultSettings() },
          shipment: {
            brokerLoadNumber: (load.load_number as string) || "",
            motorCarrier: (load.carrier_name as string) || "",
            mcAuthority: (load.carrier_mc as string) || "",
            usDot: (load.carrier_dot as string) || "",
            equipment: "",
            commodity: (load.commodity as string) || "",
            weight: (load.weight as string) || "",
            driverName: (load.driver_name as string) || (extracted?.driverName as string) || "",
            truckTag: (extracted?.truckTag as string) || "",
            truckNumber: (load.truck_number as string) || "",
          },
          billTo: {
            name: (invoice?.bill_to_name as string) || (load.shipper_name as string) || "",
            address: (invoice?.bill_to_address as string) || (load.shipper_address as string) || "",
            city: "",
            state: "",
            zip: "",
          },
          routing: {
            shipperName: (load.shipper_name as string) || "",
            originSite: (load.pickup_address as string) || "",
            pickupDate: toDisplayDate((load.pickup_date as string) || ""),
            receiverName: (extracted?.shipTo as Record<string, string>)?.name || "",
            deliverySite: (load.delivery_address as string) || "",
            deliveryDate: toDisplayDate((load.delivery_date as string) || ""),
            mcLoadNumber: (load.bol_number as string) || "",
          },
          charges: {
            linehaul: Number(invoice?.linehaul) || 0,
            fuelSurcharge: Number(invoice?.fuel_surcharge) || 0,
            accessorial: Number(invoice?.accessorial) || 0,
            totalAmountDue: Number(invoice?.total_amount) || 0,
          },
        };

        setInvoiceData(invData);

        if (invoice?.sent_to_email) {
          setEmailSent(true);
          setEmailTo(invoice.sent_to_email as string);
        }

        // Generate PDF
        const doc = <InvoiceDocument data={invData} logoUrl="/kfb-logo.png" />;
        const blob = await pdf(doc).toBlob();
        const url = URL.createObjectURL(blob);
        setPdfBlob(blob);
        setPdfUrl(url);
      } catch {
        setError("Failed to load invoice");
      } finally {
        setLoading(false);
      }
    }
    loadAndGenerate();
  }, [id]);

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
    setError(null);
    try {
      const formData = new FormData();
      formData.append("pdf", pdfBlob, `Invoice-${invoiceData.invoiceNumber}.pdf`);
      formData.append("to", emailTo);
      formData.append("invoiceNumber", invoiceData.invoiceNumber);
      formData.append("amount", invoiceData.charges.totalAmountDue.toString());
      formData.append("brokerName", invoiceData.broker.companyName);
      formData.append("shipperName", invoiceData.routing.shipperName);
      formData.append("pickupAddress", invoiceData.routing.originSite);
      formData.append("deliveryAddress", invoiceData.routing.deliverySite);
      formData.append("pickupDate", invoiceData.routing.pickupDate);
      formData.append("deliveryDate", invoiceData.routing.deliveryDate);
      formData.append("linehaul", invoiceData.charges.linehaul.toString());
      formData.append("fuelSurcharge", invoiceData.charges.fuelSurcharge.toString());
      formData.append("accessorial", invoiceData.charges.accessorial.toString());

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

      // Update invoice status in Supabase
      await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loadId: id,
          emailSentTo: emailTo,
        }),
      });
    } catch {
      setError("Failed to send email");
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
        <p className="text-sm text-slate-500">Generating invoice PDF...</p>
      </div>
    );
  }

  if (error && !invoiceData) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
        <p className="text-sm font-medium text-red-800">{error}</p>
        <button onClick={() => router.push("/board")} className="mt-3 text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
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
            #{invoiceData?.invoiceNumber} &middot; {formatCurrency(invoiceData?.charges.totalAmountDue || 0)}
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4">
          <svg className="h-5 w-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Something went wrong</p>
            <p className="text-sm text-red-600 mt-0.5">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 cursor-pointer">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* PDF Preview */}
      {pdfUrl && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <iframe src={pdfUrl} className="w-full h-[400px] sm:h-[500px]" title="Invoice PDF Preview" />
        </div>
      )}

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
          onClick={() => router.push(`/board/${id}`)}
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

      {/* Back to Dashboard */}
      <button
        onClick={() => router.push("/board")}
        className="w-full rounded-xl border-2 border-dashed border-slate-300 py-4 text-sm font-medium text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
      >
        &larr; Back to Dashboard
      </button>
    </div>
  );
}
