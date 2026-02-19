"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { InvoicePreview } from "@/components/InvoicePreview";
import { InvoiceDocument } from "@/components/InvoiceDocument";
import type { InvoiceData } from "@/lib/types";
import { pdf } from "@react-pdf/renderer";
import { getDefaultSettings, type BrokerSettings } from "@/lib/broker-defaults";

/** Convert YYYY-MM-DD to MM-DD-YYYY for display */
function toDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return `${match[2]}-${match[3]}-${match[1]}`;
  return dateStr;
}

function buildInvoiceFromDb(load: Record<string, string | number | null>, invoice: Record<string, string | number | null>, documents: Record<string, unknown>[], brokerSettings?: BrokerSettings | null): InvoiceData {
  // Check if we stored full invoice data in the document's extracted_data
  const bolDoc = documents?.find((d: Record<string, unknown>) => d.type === "bol");
  const extracted = bolDoc?.extracted_data as Record<string, unknown> | null;

  const now = new Date();
  const today = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${now.getFullYear()}`;

  return {
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
      pickupDate: toDisplayDate((load.picked_up_at as string) || (load.pickup_date as string) || ""),
      receiverName: (extracted?.shipTo as Record<string, string>)?.name || "",
      deliverySite: (load.delivery_address as string) || "",
      deliveryDate: toDisplayDate((load.delivered_at as string) || (load.delivery_date as string) || ""),
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

interface DriverOption {
  id: string;
  name: string;
  truck_number: string | null;
  mc_number: string | null;
}

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [assignedDriverId, setAssignedDriverId] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [loadStatus, setLoadStatus] = useState<string>("created");

  useEffect(() => {
    async function loadData() {
      try {
        const [invoiceRes, settingsRes, driversRes] = await Promise.all([
          fetch(`/api/invoices/${id}`),
          fetch("/api/settings"),
          fetch("/api/drivers"),
        ]);
        if (!invoiceRes.ok) {
          setError("Load not found");
          setLoading(false);
          return;
        }
        const { data } = await invoiceRes.json();
        const settingsData = settingsRes.ok ? (await settingsRes.json()).data as BrokerSettings : null;
        const invoiceFromDb = buildInvoiceFromDb(data.load, data.invoice, data.documents || [], settingsData);
        setInvoiceData(invoiceFromDb);
        setAssignedDriverId(data.load.driver_id || null);
        setLoadStatus(data.load.status || "created");

        if (driversRes.ok) {
          const { drivers: driverList } = await driversRes.json();
          setDrivers(driverList || []);
        }
      } catch {
        setError("Failed to load invoice data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleAssignDriver = async (driverId: string) => {
    if (!driverId) return;
    setIsAssigning(true);
    try {
      const res = await fetch(`/api/loads/${id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId }),
      });
      if (res.ok) {
        const { data: updatedLoad } = await res.json();
        setAssignedDriverId(driverId);
        setLoadStatus(updatedLoad.status);
        // Update invoice data with driver info
        if (invoiceData) {
          setInvoiceData({
            ...invoiceData,
            shipment: {
              ...invoiceData.shipment,
              motorCarrier: updatedLoad.carrier_name || invoiceData.shipment.motorCarrier,
              mcAuthority: updatedLoad.carrier_mc || invoiceData.shipment.mcAuthority,
              usDot: updatedLoad.carrier_dot || invoiceData.shipment.usDot,
              driverName: updatedLoad.driver_name || invoiceData.shipment.driverName,
              truckNumber: updatedLoad.truck_number || invoiceData.shipment.truckNumber,
            },
          });
        }
      }
    } catch {
      // Failed to assign
    } finally {
      setIsAssigning(false);
    }
  };

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

      {/* Driver Assignment */}
      {drivers.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
            <h3 className="text-sm font-semibold text-slate-800">Assign Driver</h3>
            {assignedDriverId && (
              <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700 uppercase tracking-wider ml-auto">
                {loadStatus === "tendered" ? "Tendered" : loadStatus === "accepted" ? "Accepted" : loadStatus === "in_transit" ? "In Transit" : loadStatus === "delivered" ? "Delivered" : loadStatus}
              </span>
            )}
          </div>
          <select
            value={assignedDriverId || ""}
            onChange={(e) => handleAssignDriver(e.target.value)}
            disabled={isAssigning}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <option value="">Select a driver...</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}{d.truck_number ? ` — Truck #${d.truck_number}` : ""}{d.mc_number ? ` (MC-${d.mc_number})` : ""}
              </option>
            ))}
          </select>
          {isAssigning && (
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Assigning driver and auto-filling carrier info...
            </p>
          )}
        </div>
      )}

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
