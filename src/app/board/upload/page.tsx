"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BOLUploader } from "@/components/BOLUploader";
import type { BolExtractedData } from "@/lib/types";
import { getDefaultSettings, type BrokerSettings } from "@/lib/broker-defaults";

/** Convert YYYY-MM-DD to MM-DD-YYYY for display */
function toDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return `${match[2]}-${match[3]}-${match[1]}`;
  return dateStr;
}

export default function UploadPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [brokerSettings, setBrokerSettings] = useState<BrokerSettings>(getDefaultSettings());

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(({ data }) => {
      if (data) setBrokerSettings(data);
    }).catch(() => {});
  }, []);

  const handleExtracted = async (data: Record<string, unknown>) => {
    const bol = data as unknown as BolExtractedData;
    setIsSaving(true);
    setError(null);

    const now = new Date();
    const today = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${now.getFullYear()}`;
    const invoiceNumber = bol.brokerLoadNumber ? `F${bol.brokerLoadNumber.replace(/\D/g, "")}` : `F${Date.now()}`;

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber,
          invoiceDate: today,
          shipperName: bol.shipFrom.name,
          shipperAddress: `${bol.shipFrom.address}${bol.shipFrom.city ? `, ${bol.shipFrom.city}` : ""}`,
          pickupAddress: `${bol.shipFrom.address}${bol.shipFrom.city ? `, ${bol.shipFrom.city}` : ""}`,
          pickupDate: bol.pickupDate || null,
          deliveryAddress: `${bol.shipTo.address}${bol.shipTo.city ? `, ${bol.shipTo.city}` : ""}`,
          deliveryDate: bol.deliveryDate || null,
          commodity: `${bol.commodity}${bol.quantity ? `, ${bol.quantity}` : ""}`,
          weight: bol.weight,
          carrierName: bol.carrierName,
          carrierMc: "",
          truckNumber: bol.truckNumber,
          bolNumber: bol.bolNumber,
          billToName: bol.shipFrom.name,
          billToAddress: `${bol.shipFrom.address}, ${bol.shipFrom.city}, ${bol.shipFrom.state} ${bol.shipFrom.zip}`,
          totalAmount: null,
          extractedData: data,
          // Store full BOL + broker data for the review page
          fullInvoiceData: JSON.stringify({
            invoiceNumber,
            invoiceDate: today,
            broker: { ...brokerSettings },
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
          }),
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Failed to save load");
        setIsSaving(false);
        return;
      }

      // Redirect to the review page for this load
      const loadId = result.data?.load?.id;
      if (loadId) {
        router.push(`/board/${loadId}`);
      } else {
        setError("Load created but could not get ID. Check the dashboard.");
        setIsSaving(false);
      }
    } catch {
      setError("Failed to save load. Check your connection and try again.");
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Upload Bill of Lading
        </h2>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
          Take a photo or upload an image of the BOL. AI will extract all fields and pre-fill your invoice.
        </p>
      </div>

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

      {isSaving ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="text-sm font-semibold text-slate-700">Creating load record...</p>
        </div>
      ) : (
        <BOLUploader onExtracted={handleExtracted} onError={setError} />
      )}
    </div>
  );
}
