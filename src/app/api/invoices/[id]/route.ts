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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Fetch load with its invoice and documents
  const { data: load, error: loadError } = await supabase
    .from("loads")
    .select("*")
    .eq("id", id)
    .single();

  if (loadError) {
    return NextResponse.json({ error: loadError.message }, { status: 404 });
  }

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("load_id", id)
    .single();

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("load_id", id);

  return NextResponse.json({ data: { load, invoice, documents } });
}
