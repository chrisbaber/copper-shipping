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

    if (!pdfFile || !to) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const pdfBytes = await pdfFile.arrayBuffer();
    const pdfBuffer = Buffer.from(pdfBytes);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"${brokerName}" <${process.env.SMTP_USER}>`,
      to,
      subject: `Invoice ${invoiceNumber} — ${brokerName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a56db;">Invoice ${invoiceNumber}</h2>
          <p>Please find attached your invoice from <strong>${brokerName}</strong>.</p>
          <p style="font-size: 18px; font-weight: bold; color: #1a1a1a;">
            Amount Due: $${Number.parseFloat(amount).toFixed(2)}
          </p>
          <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">
            Thank you for selecting ${brokerName} for your logistical services.
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
