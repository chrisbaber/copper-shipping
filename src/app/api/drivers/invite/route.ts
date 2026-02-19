import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { getSiteUrl } from "@/lib/config/env";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(req: NextRequest) {
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await req.json();
  const { name, email, phone, mcNumber, dotNumber, truckNumber, truckTag, equipment } = body;

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  // Create invitation
  const { data: invitation, error } = await supabase
    .from("driver_invitations")
    .insert({
      name,
      email: email.toLowerCase().trim(),
      phone: phone || null,
      mc_number: mcNumber || null,
      dot_number: dotNumber || null,
      truck_number: truckNumber || null,
      truck_tag: truckTag || null,
      equipment: equipment || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send invitation email
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      const host = process.env.SMTP_HOST.trim();
      const port = parseInt((process.env.SMTP_PORT || "465").trim(), 10);
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user: process.env.SMTP_USER.trim(),
          pass: process.env.SMTP_PASS?.trim(),
        },
      });

      const inviteUrl = `${getSiteUrl()}/invite/${invitation.invite_token}`;

      await transporter.sendMail({
        from: `"Kingdom Family Brokerage" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "You've been invited to join KFB as a driver",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; color: #1a1a1a;">
            <div style="border-bottom: 2px solid #d97706; padding-bottom: 15px; margin-bottom: 20px;">
              <h2 style="color: #d97706; margin: 0;">Driver Invitation</h2>
              <p style="color: #666; font-size: 13px; margin: 4px 0 0 0;">Kingdom Family Brokerage</p>
            </div>

            <p style="font-size: 14px;">Hi ${name},</p>

            <p style="font-size: 14px;">
              You've been invited to join <strong>Kingdom Family Brokerage</strong> as a driver.
              Click the button below to create your account and start receiving loads.
            </p>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${inviteUrl}" style="display: inline-block; background: #d97706; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                Accept Invitation
              </a>
            </div>

            <p style="font-size: 12px; color: #999;">
              This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it.
            </p>
          </div>
        `,
      });
    } catch {
      // Email send failed — invitation still created, broker can share link manually
    }
  }

  return NextResponse.json({ data: invitation });
}
