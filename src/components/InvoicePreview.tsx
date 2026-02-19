"use client";

import type { InvoiceData } from "@/lib/types";

interface InvoicePreviewProps {
  data: InvoiceData;
  onChange: (data: InvoiceData) => void;
}

function Field({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

export function InvoicePreview({ data, onChange }: InvoicePreviewProps) {
  const update = (path: string, value: string) => {
    const parts = path.split(".");
    const newData = structuredClone(data);
    // biome-ignore lint/suspicious/noExplicitAny: dynamic path traversal
    let obj: any = newData;
    for (let i = 0; i < parts.length - 1; i++) {
      obj = obj[parts[i]];
    }
    const lastKey = parts[parts.length - 1];
    if (path.startsWith("charges.")) {
      obj[lastKey] = Number.parseFloat(value) || 0;
    } else {
      obj[lastKey] = value;
    }
    if (path.startsWith("charges.") && lastKey !== "totalAmountDue") {
      newData.charges.totalAmountDue =
        newData.charges.linehaul + newData.charges.fuelSurcharge + newData.charges.accessorial;
    }
    onChange(newData);
  };

  return (
    <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">Invoice Details</h2>
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
          All fields editable
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Invoice #" value={data.invoiceNumber} onChange={(v) => update("invoiceNumber", v)} />
        <Field label="Invoice Date" value={data.invoiceDate} onChange={(v) => update("invoiceDate", v)} />
      </div>

      <div className="border-t border-slate-100" />

      <Section title="Shipment Data">
        <Field
          label="Broker Load #"
          value={data.shipment.brokerLoadNumber}
          onChange={(v) => update("shipment.brokerLoadNumber", v)}
        />
        <Field
          label="Motor Carrier"
          value={data.shipment.motorCarrier}
          onChange={(v) => update("shipment.motorCarrier", v)}
        />
        <Field
          label="MC Authority"
          value={data.shipment.mcAuthority}
          onChange={(v) => update("shipment.mcAuthority", v)}
        />
        <Field label="US DOT" value={data.shipment.usDot} onChange={(v) => update("shipment.usDot", v)} />
        <Field label="Equipment" value={data.shipment.equipment} onChange={(v) => update("shipment.equipment", v)} />
        <Field label="Commodity" value={data.shipment.commodity} onChange={(v) => update("shipment.commodity", v)} />
        <Field label="Weight" value={data.shipment.weight} onChange={(v) => update("shipment.weight", v)} />
      </Section>

      <div className="border-t border-slate-100" />

      <Section title="Bill To">
        <Field label="Customer Name" value={data.billTo.name} onChange={(v) => update("billTo.name", v)} />
        <Field label="Address" value={data.billTo.address} onChange={(v) => update("billTo.address", v)} />
        <Field label="City" value={data.billTo.city} onChange={(v) => update("billTo.city", v)} />
        <Field label="State" value={data.billTo.state} onChange={(v) => update("billTo.state", v)} />
        <Field label="ZIP" value={data.billTo.zip} onChange={(v) => update("billTo.zip", v)} />
      </Section>

      <div className="border-t border-slate-100" />

      <Section title="Routing Details">
        <Field
          label="Shipper Name"
          value={data.routing.shipperName}
          onChange={(v) => update("routing.shipperName", v)}
        />
        <Field label="Origin Site" value={data.routing.originSite} onChange={(v) => update("routing.originSite", v)} />
        <Field label="Pickup Date" value={data.routing.pickupDate} onChange={(v) => update("routing.pickupDate", v)} />
        <Field
          label="Receiver Name"
          value={data.routing.receiverName}
          onChange={(v) => update("routing.receiverName", v)}
        />
        <Field
          label="Delivery Site"
          value={data.routing.deliverySite}
          onChange={(v) => update("routing.deliverySite", v)}
        />
        <Field
          label="Delivery Date"
          value={data.routing.deliveryDate}
          onChange={(v) => update("routing.deliveryDate", v)}
        />
        <Field
          label="MC Load #"
          value={data.routing.mcLoadNumber}
          onChange={(v) => update("routing.mcLoadNumber", v)}
        />
      </Section>

      <div className="border-t border-slate-100" />

      <Section title="Charges">
        <Field
          label="Linehaul ($)"
          value={data.charges.linehaul}
          onChange={(v) => update("charges.linehaul", v)}
        />
        <Field
          label="Fuel Surcharge ($)"
          value={data.charges.fuelSurcharge}
          onChange={(v) => update("charges.fuelSurcharge", v)}
        />
        <Field
          label="Accessorial ($)"
          value={data.charges.accessorial}
          onChange={(v) => update("charges.accessorial", v)}
        />
        <div className="sm:col-span-2 rounded-lg bg-slate-900 px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-white">Total Amount Due</span>
          <span className="text-lg font-bold text-white">
            ${data.charges.totalAmountDue.toFixed(2)}
          </span>
        </div>
      </Section>
    </div>
  );
}
