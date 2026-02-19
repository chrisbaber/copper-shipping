"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { InvoicePreview } from "@/components/InvoicePreview";
import { InvoiceDocument } from "@/components/InvoiceDocument";
import type { InvoiceData } from "@/lib/types";
import { pdf } from "@react-pdf/renderer";

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

function buildInvoiceFromDb(load: Record<string, string | number | null>, invoice: Record<string, string | number | null>, documents: Record<string, unknown>[]): InvoiceData {
  // Check if we stored full invoice data in the document's extracted_data
  const bolDoc = documents?.find((d: Record<string, unknown>) => d.type === "bol");
  const extracted = bolDoc?.extracted_data as Record<string, unknown> | null;

  const now = new Date();
  const today = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${now.getFullYear()}`;

  return {
    invoiceNumber: (invoice?.invoice_number as string) || (load.load_number as string) || "",
    invoiceDate: today,
    broker: { ...DEFAULT_BROKER },
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
}

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/invoices/${id}`);
        if (!res.ok) {
          setError("Load not found");
          setLoading(false);
          return;
        }
        const { data } = await res.json();
        const invoiceFromDb = buildInvoiceFromDb(data.load, data.invoice, data.documents || []);
        setInvoiceData(invoiceFromDb);
      } catch {
        setError("Failed to load invoice data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleGeneratePdf = async () => {
    if (!invoiceData) return;
    setIsGenerating(true);
    try {
      // Update the invoice in Supabase with any edits
      await fetch(`/api/invoices`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loadId: id,
          invoiceNumber: invoiceData.invoiceNumber,
          billToName: invoiceData.billTo.name,
          billToAddress: `${invoiceData.billTo.address}, ${invoiceData.billTo.city}, ${invoiceData.billTo.state} ${invoiceData.billTo.zip}`,
          linehaul: invoiceData.charges.linehaul,
          fuelSurcharge: invoiceData.charges.fuelSurcharge,
          accessorial: invoiceData.charges.accessorial,
          totalAmount: invoiceData.charges.totalAmountDue,
          // Store full invoice data for the send page
          shipperName: invoiceData.routing.shipperName,
          pickupAddress: invoiceData.routing.originSite,
          pickupDate: invoiceData.routing.pickupDate,
          deliveryAddress: invoiceData.routing.deliverySite,
          deliveryDate: invoiceData.routing.deliveryDate,
          commodity: invoiceData.shipment.commodity,
          weight: invoiceData.shipment.weight,
          carrierName: invoiceData.shipment.motorCarrier,
        }),
      });

      // Generate the PDF to verify it works before navigating
      const doc = <InvoiceDocument data={invoiceData} logoUrl="/kfb-logo.png" />;
      await pdf(doc).toBlob();

      router.push(`/board/${id}/send`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  if (error || !invoiceData) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
        <p className="text-sm font-medium text-red-800">{error || "Invoice not found"}</p>
        <button onClick={() => router.push("/board")} className="mt-3 text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Review Invoice</h2>
          <p className="text-sm text-slate-500 mt-0.5">#{invoiceData.invoiceNumber}</p>
        </div>
        <button
          onClick={() => router.push("/board")}
          className="text-xs font-medium text-slate-500 hover:text-slate-700 cursor-pointer"
        >
          &larr; Dashboard
        </button>
      </div>

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
  );
}
