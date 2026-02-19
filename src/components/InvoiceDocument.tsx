"use client";

import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { InvoiceData } from "@/lib/types";

// Register a clean sans-serif font
Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fMZg.ttf", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf", fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 9,
    padding: 40,
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    borderBottom: "2px solid #1a56db",
    paddingBottom: 15,
  },
  headerLeft: {
    flexDirection: "column",
    gap: 2,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1a56db",
    marginBottom: 4,
  },
  headerText: {
    fontSize: 8,
    color: "#666",
  },
  headerCredentials: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: "#1a1a1a",
    marginBottom: 6,
  },
  invoiceMeta: {
    fontSize: 9,
    color: "#555",
    textAlign: "right" as const,
  },
  twoColumn: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 20,
  },
  column: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#1a56db",
    marginBottom: 8,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  sectionBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    padding: 10,
    marginBottom: 15,
  },
  row: {
    flexDirection: "row",
    marginBottom: 3,
  },
  label: {
    width: 100,
    fontSize: 8,
    fontWeight: 600,
    color: "#555",
  },
  value: {
    flex: 1,
    fontSize: 9,
    color: "#1a1a1a",
  },
  billToName: {
    fontSize: 11,
    fontWeight: 700,
    color: "#1a1a1a",
    marginBottom: 6,
  },
  billToLine: {
    fontSize: 9,
    color: "#1a1a1a",
    marginBottom: 2,
  },
  chargesTable: {
    marginTop: 10,
    borderTop: "1px solid #e5e7eb",
  },
  chargeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottom: "1px solid #f0f0f0",
  },
  chargeLabel: {
    fontSize: 9,
    color: "#555",
  },
  chargeValue: {
    fontSize: 9,
    color: "#1a1a1a",
    fontWeight: 600,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: "#1a56db",
    borderRadius: 4,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#fff",
  },
  totalValue: {
    fontSize: 11,
    fontWeight: 700,
    color: "#fff",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: "1px solid #e5e7eb",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: "#999",
    textAlign: "center" as const,
  },
  footerSubmitted: {
    fontSize: 8,
    color: "#666",
    textAlign: "center" as const,
    marginTop: 4,
  },
  logoImage: {
    width: 120,
    height: 60,
    marginBottom: 6,
    objectFit: "contain" as const,
  },
});

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

interface InvoiceDocumentProps {
  data: InvoiceData;
  logoUrl?: string;
}

export function InvoiceDocument({ data, logoUrl }: InvoiceDocumentProps) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {logoUrl && <Image src={logoUrl} style={styles.logoImage} />}
            <Text style={styles.companyName}>{data.broker.companyName}</Text>
            <Text style={styles.headerText}>{data.broker.address}</Text>
            <Text style={styles.headerText}>
              {data.broker.city}, {data.broker.state} {data.broker.zip}
            </Text>
            <Text style={styles.headerText}>{data.broker.phone}</Text>
            <Text style={styles.headerText}>{data.broker.email}</Text>
            <View style={styles.headerCredentials}>
              <Text style={{ ...styles.headerText, fontWeight: 600 }}>EIN {data.broker.ein}</Text>
              <Text style={{ ...styles.headerText, fontWeight: 600 }}>MC# {data.broker.mcNumber}</Text>
              <Text style={{ ...styles.headerText, fontWeight: 600 }}>US DOT# {data.broker.usDot}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceMeta}>Invoice # {data.invoiceNumber}</Text>
            <Text style={styles.invoiceMeta}>Date: {data.invoiceDate}</Text>
          </View>
        </View>

        {/* Shipment Data + Bill To */}
        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Shipment Data</Text>
            <View style={styles.sectionBox}>
              <View style={styles.row}>
                <Text style={styles.label}>Broker Load:</Text>
                <Text style={styles.value}>{data.shipment.brokerLoadNumber}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Motor Carrier:</Text>
                <Text style={styles.value}>{data.shipment.motorCarrier}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Driver:</Text>
                <Text style={styles.value}>{data.shipment.driverName}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Truck Tag #:</Text>
                <Text style={styles.value}>{data.shipment.truckTag}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Truck Number:</Text>
                <Text style={styles.value}>{data.shipment.truckNumber}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>MC Authority:</Text>
                <Text style={styles.value}>{data.shipment.mcAuthority}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>US DOT:</Text>
                <Text style={styles.value}>{data.shipment.usDot}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Equipment:</Text>
                <Text style={styles.value}>{data.shipment.equipment}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Commodity:</Text>
                <Text style={styles.value}>{data.shipment.commodity}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Weight:</Text>
                <Text style={styles.value}>{data.shipment.weight}</Text>
              </View>
            </View>
          </View>

          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <View style={styles.sectionBox}>
              <Text style={styles.billToName}>{data.billTo.name}</Text>
              <Text style={styles.billToLine}>{data.billTo.address}</Text>
              <Text style={styles.billToLine}>
                {data.billTo.city}{data.billTo.city && data.billTo.state ? ", " : ""}{data.billTo.state} {data.billTo.zip}
              </Text>
            </View>
          </View>
        </View>

        {/* Routing Details */}
        <Text style={styles.sectionTitle}>Routing Details</Text>
        <View style={styles.sectionBox}>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Shipper:</Text>
                <Text style={styles.value}>{data.routing.shipperName}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Origin:</Text>
                <Text style={styles.value}>{data.routing.originSite}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Pickup Date:</Text>
                <Text style={styles.value}>{data.routing.pickupDate}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>MC Load #:</Text>
                <Text style={styles.value}>{data.routing.mcLoadNumber}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Receiver:</Text>
                <Text style={styles.value}>{data.routing.receiverName}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Delivery Site:</Text>
                <Text style={styles.value}>{data.routing.deliverySite}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Delivery Date:</Text>
                <Text style={styles.value}>{data.routing.deliveryDate}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Charges */}
        <Text style={styles.sectionTitle}>Charges</Text>
        <View style={styles.chargesTable}>
          <View style={styles.chargeRow}>
            <Text style={styles.chargeLabel}>Linehaul</Text>
            <Text style={styles.chargeValue}>{formatCurrency(data.charges.linehaul)}</Text>
          </View>
          <View style={styles.chargeRow}>
            <Text style={styles.chargeLabel}>Fuel Surcharge</Text>
            <Text style={styles.chargeValue}>
              {data.charges.fuelSurcharge > 0 ? formatCurrency(data.charges.fuelSurcharge) : "N/A"}
            </Text>
          </View>
          <View style={styles.chargeRow}>
            <Text style={styles.chargeLabel}>Accessorial</Text>
            <Text style={styles.chargeValue}>
              {data.charges.accessorial > 0 ? formatCurrency(data.charges.accessorial) : "$0.00"}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL AMOUNT DUE</Text>
            <Text style={styles.totalValue}>{formatCurrency(data.charges.totalAmountDue)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for selecting {data.broker.companyName} for your logistical services.
          </Text>
          <Text style={styles.footerSubmitted}>Submitted by: Henry L Wolfe</Text>
        </View>
      </Page>
    </Document>
  );
}
