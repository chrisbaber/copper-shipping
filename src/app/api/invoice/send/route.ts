import { type NextRequest, NextResponse } from "next/server";

export const maxDuration = 15;

export async function POST(req: NextRequest) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json(
        { error: "Email sending is not configured. Please add RESEND_API_KEY." },
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

    // Convert PDF to base64
    const pdfBytes = await pdfFile.arrayBuffer();
    const pdfBase64 = Buffer.from(pdfBytes).toString("base64");

    // Send via Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${brokerName} <invoices@copper-shipping.com>`,
        to: [to],
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
            content: pdfBase64,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return NextResponse.json(
        { error: `Failed to send email: ${errorBody}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send invoice email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
