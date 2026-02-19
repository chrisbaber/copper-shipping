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

const TRANSITIONS: Record<string, { from: string; to: string; field: string }> = {
  accept: { from: "tendered", to: "accepted", field: "accepted_at" },
  pickup: { from: "accepted", to: "in_transit", field: "picked_up_at" },
  dropoff: { from: "in_transit", to: "delivered", field: "delivered_at" },
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await params;
  const { action } = await req.json();

  const transition = TRANSITIONS[action];
  if (!transition) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Update only if the load is in the expected status
  const { data, error } = await supabase
    .from("loads")
    .update({
      status: transition.to,
      [transition.field]: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", transition.from)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Load not found or invalid status transition" },
      { status: 400 }
    );
  }

  return NextResponse.json({ data });
}
