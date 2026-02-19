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

export async function POST(req: NextRequest) {
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { token, userId } = await req.json();

  if (!token || !userId) {
    return NextResponse.json({ error: "Token and userId required" }, { status: 400 });
  }

  // Fetch invitation
  const { data: invitation, error: invError } = await supabase
    .from("driver_invitations")
    .select("*")
    .eq("invite_token", token)
    .eq("state", "pending")
    .single();

  if (invError || !invitation) {
    return NextResponse.json({ error: "Invalid or already accepted invitation" }, { status: 400 });
  }

  // Create driver profile
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      email: invitation.email,
      name: invitation.name,
      role: "driver",
      phone: invitation.phone,
      mc_number: invitation.mc_number,
      dot_number: invitation.dot_number,
      truck_number: invitation.truck_number,
      truck_tag: invitation.truck_tag,
      equipment: invitation.equipment,
    });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // Mark invitation as accepted
  await supabase
    .from("driver_invitations")
    .update({ state: "accepted" })
    .eq("id", invitation.id);

  // Set user_metadata.role = 'driver' on the auth user
  await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { role: "driver", name: invitation.name },
  });

  return NextResponse.json({ success: true });
}
