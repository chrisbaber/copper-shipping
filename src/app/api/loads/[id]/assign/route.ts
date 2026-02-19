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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await params;
  const { driverId } = await req.json();

  if (!driverId) {
    return NextResponse.json({ error: "driverId required" }, { status: 400 });
  }

  // Fetch driver profile for auto-fill
  const { data: driver, error: driverError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", driverId)
    .eq("role", "driver")
    .single();

  if (driverError || !driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  // Update load with driver info + set tendered status
  const { data, error } = await supabase
    .from("loads")
    .update({
      driver_id: driverId,
      driver_name: driver.name,
      carrier_name: driver.name,
      carrier_mc: driver.mc_number,
      carrier_dot: driver.dot_number,
      truck_number: driver.truck_number,
      status: "tendered",
      tendered_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
