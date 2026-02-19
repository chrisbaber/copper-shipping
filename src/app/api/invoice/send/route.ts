import { type NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 15;

async function fetchSettings() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;

  try {
    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data } = await supabase
      .from("broker_settings")
      .select("*")
      .limit(1)
      .single();

    if (!data) return null;

    return {
      bankName: (data.bank_name as string) || "Bank of America",
      bankAccount: (data.bank_account as string) || "488135011117",
      bankRouting: (data.bank_routing as string) || "111 000 025",
      submittedBy: (data.submitted_by as string) || "Henry L Wolfe",
      contactPhone: (data.contact_phone as string) || "(682) 231-3575",
      contactEmail: (data.contact_email as string) || "Hlrolfe@dfwtrucking.com",
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      return NextResponse.json(
        { error: "Email sending is not configured. Please add SMTP credentials." },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const pdfFile = formData.get("pdf") as File | null;
    const to = formData.get("to") as string;
    const invoiceNumber = formData.get("invoiceNumber") as string;
    const amount = formData.get("amount") as string;
    const brokerName = formData.get("brokerName") as string;
    const shipperName = formData.get("shipperName") as string || "";
    const pickupAddress = formData.get("pickupAddress") as string || "";
    const deliveryAddress = formData.get("deliveryAddress") as string || "";
    const pickupDate = formData.get("pickupDate") as string || "";
    const deliveryDate = formData.get("deliveryDate") as string || "";
    const linehaul = formData.get("linehaul") as string || "0";
    const fuelSurcharge = formData.get("fuelSurcharge") as string || "0";
    const accessorial = formData.get("accessorial") as string || "0";

    if (!pdfFile || !to) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch dynamic settings from DB
    const settings = await fetchSettings();
    const bankName = settings?.bankName || "Bank of America";
    const bankAccount = settings?.bankAccount || "488135011117";
    const bankRouting = settings?.bankRouting || "111 000 025";
    const submittedBy = settings?.submittedBy || "Henry L Wolfe";
    const contactPhone = settings?.contactPhone || "(682) 231-3575";
    const contactEmail = settings?.contactEmail || "Hlrolfe@dfwtrucking.com";

    const pdfBytes = await pdfFile.arrayBuffer();
    const pdfBuffer = Buffer.from(pdfBytes);

    const host = process.env.SMTP_HOST!.trim();
    const port = parseInt((process.env.SMTP_PORT || "465").trim(), 10);
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER!.trim(),
        pass: process.env.SMTP_PASS!.trim(),
      },
    });

    const amountFormatted = Number.parseFloat(amount).toFixed(2);
    const linehaulFormatted = Number.parseFloat(linehaul).toFixed(2);
    const fuelFormatted = Number.parseFloat(fuelSurcharge).toFixed(2);
    const accessorialFormatted = Number.parseFloat(accessorial).toFixed(2);

    await transporter.sendMail({
      from: `"${brokerName}" <${process.env.SMTP_USER}>`,
      to,
      subject: `Invoice ${invoiceNumber} — ${brokerName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <div style="border-bottom: 2px solid #1a56db; padding-bottom: 15px; margin-bottom: 20px;">
            <h2 style="color: #1a56db; margin: 0 0 4px 0;">Invoice ${invoiceNumber}</h2>
            <p style="color: #666; font-size: 13px; margin: 0;">${brokerName}</p>
          </div>

          <p style="font-size: 14px;">Please find attached your invoice for the following shipment:</p>

          ${shipperName ? `
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
            <tr style="background: #f8fafc;">
              <td style="padding: 8px 12px; font-weight: 600; color: #555; width: 120px;">Shipper</td>
              <td style="padding: 8px 12px;">${shipperName}</td>
            </tr>
            ${pickupAddress ? `<tr><td style="padding: 8px 12px; font-weight: 600; color: #555;">Pickup</td><td style="padding: 8px 12px;">${pickupAddress}${pickupDate ? ` — ${pickupDate}` : ""}</td></tr>` : ""}
            ${deliveryAddress ? `<tr style="background: #f8fafc;"><td style="padding: 8px 12px; font-weight: 600; color: #555;">Delivery</td><td style="padding: 8px 12px;">${deliveryAddress}${deliveryDate ? ` — ${deliveryDate}` : ""}</td></tr>` : ""}
          </table>
          ` : ""}

          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; border-top: 1px solid #e5e7eb;">
            <tr>
              <td style="padding: 8px 12px; color: #555;">Linehaul</td>
              <td style="padding: 8px 12px; text-align: right; font-weight: 600;">$${linehaulFormatted}</td>
            </tr>
            ${Number.parseFloat(fuelSurcharge) > 0 ? `
            <tr style="background: #f8fafc;">
              <td style="padding: 8px 12px; color: #555;">Fuel Surcharge</td>
              <td style="padding: 8px 12px; text-align: right; font-weight: 600;">$${fuelFormatted}</td>
            </tr>` : ""}
            ${Number.parseFloat(accessorial) > 0 ? `
            <tr>
              <td style="padding: 8px 12px; color: #555;">Accessorial</td>
              <td style="padding: 8px 12px; text-align: right; font-weight: 600;">$${accessorialFormatted}</td>
            </tr>` : ""}
            <tr style="background: #1a56db; color: white;">
              <td style="padding: 10px 12px; font-weight: 700; font-size: 14px;">TOTAL AMOUNT DUE</td>
              <td style="padding: 10px 12px; text-align: right; font-weight: 700; font-size: 14px;">$${amountFormatted}</td>
            </tr>
          </table>

          <div style="background: #f8fafc; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p style="font-weight: 700; font-size: 13px; margin: 0 0 8px 0; color: #1a56db;">Payment Instructions</p>
            <p style="font-size: 13px; margin: 0 0 4px 0;"><strong>${brokerName}</strong></p>
            <p style="font-size: 13px; margin: 0 0 4px 0;">${bankName}</p>
            <p style="font-size: 13px; margin: 0 0 2px 0;">Account #: <strong>${bankAccount}</strong></p>
            <p style="font-size: 13px; margin: 0 0 8px 0;">Routing #: <strong>${bankRouting}</strong></p>
            <p style="font-size: 12px; color: #666; margin: 0;">Payment Terms: Due upon receipt</p>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />

          <p style="font-size: 13px;">
            If you have any questions about this invoice, please contact us at
            <strong>${contactPhone}</strong> or <strong>${contactEmail}</strong>.
          </p>

          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            Thank you for selecting ${brokerName} for your logistical services.
          </p>
          <p style="color: #999; font-size: 11px;">
            Submitted by: ${submittedBy}
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `${brokerName.split(",")[0]?.trim() || "Invoice"}-${invoiceNumber}-${shipperName.replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "Invoice"}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send invoice email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
