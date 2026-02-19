import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET() {
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ drivers: [], invitations: [] });
  }

  const [driversRes, invitationsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("role", "driver")
      .order("created_at", { ascending: false }),
    supabase
      .from("driver_invitations")
      .select("*")
      .eq("state", "pending")
      .order("created_at", { ascending: false }),
  ]);

  return NextResponse.json({
    drivers: driversRes.data || [],
    invitations: invitationsRes.data || [],
  });
}
