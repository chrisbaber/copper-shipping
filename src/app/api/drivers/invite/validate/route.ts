import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(req: NextRequest) {
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const { data: invitation, error } = await supabase
    .from("driver_invitations")
    .select("*")
    .eq("invite_token", token)
    .single();

  if (error || !invitation) {
    return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
  }

  if (invitation.state === "accepted") {
    return NextResponse.json({ error: "This invitation has already been accepted" }, { status: 410 });
  }

  if (invitation.state === "expired" || new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json({ error: "This invitation has expired" }, { status: 410 });
  }

  return NextResponse.json({
    data: {
      id: invitation.id,
      name: invitation.name,
      email: invitation.email,
      phone: invitation.phone,
      mcNumber: invitation.mc_number,
      dotNumber: invitation.dot_number,
      truckNumber: invitation.truck_number,
      truckTag: invitation.truck_tag,
      equipment: invitation.equipment,
    },
  });
}
