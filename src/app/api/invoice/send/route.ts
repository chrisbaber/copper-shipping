import { type NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const maxDuration = 15;

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

    const pdfBytes = await pdfFile.arrayBuffer();
    const pdfBuffer = Buffer.from(pdfBytes);

    const port = parseInt(process.env.SMTP_PORT || "465", 10);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
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
            <p style="font-size: 13px; margin: 0 0 4px 0;">Bank of America</p>
            <p style="font-size: 13px; margin: 0 0 2px 0;">Account #: <strong>488135011117</strong></p>
            <p style="font-size: 13px; margin: 0 0 8px 0;">Routing #: <strong>111 000 025</strong></p>
            <p style="font-size: 12px; color: #666; margin: 0;">Payment Terms: Due upon receipt</p>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />

          <p style="font-size: 13px;">
            If you have any questions about this invoice, please contact us at
            <strong>(682) 231-3575</strong> or <strong>Hlrolfe@dfwtrucking.com</strong>.
          </p>

          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            Thank you for selecting ${brokerName} for your logistical services.
          </p>
          <p style="color: #999; font-size: 11px;">
            Submitted by: Henry L Wolfe
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `Invoice-${invoiceNumber}.pdf`,
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
