import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getDefaultSettings } from "@/lib/broker-defaults";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Convert DB snake_case row to camelCase settings object */
function rowToSettings(row: Record<string, unknown>) {
  return {
    companyName: row.company_name as string,
    address: row.address as string,
    city: row.city as string,
    state: row.state as string,
    zip: row.zip as string,
    phone: row.phone as string,
    email: row.email as string,
    ein: row.ein as string,
    mcNumber: row.mc_number as string,
    usDot: row.us_dot as string,
    bankName: row.bank_name as string,
    bankAccount: row.bank_account as string,
    bankRouting: row.bank_routing as string,
    submittedBy: row.submitted_by as string,
    contactPhone: row.contact_phone as string,
    contactEmail: row.contact_email as string,
    logoUrl: row.logo_url as string | undefined,
  };
}

export async function GET() {
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ data: getDefaultSettings() });
  }

  const { data, error } = await supabase
    .from("broker_settings")
    .select("*")
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ data: getDefaultSettings() });
  }

  return NextResponse.json({ data: rowToSettings(data) });
}

export async function PUT(req: NextRequest) {
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await req.json();

  // Get existing row ID
  const { data: existing } = await supabase
    .from("broker_settings")
    .select("id")
    .limit(1)
    .single();

  const row = {
    company_name: body.companyName || "",
    address: body.address || "",
    city: body.city || "",
    state: body.state || "",
    zip: body.zip || "",
    phone: body.phone || "",
    email: body.email || "",
    ein: body.ein || "",
    mc_number: body.mcNumber || "",
    us_dot: body.usDot || "",
    bank_name: body.bankName || "",
    bank_account: body.bankAccount || "",
    bank_routing: body.bankRouting || "",
    submitted_by: body.submittedBy || "",
    contact_phone: body.contactPhone || "",
    contact_email: body.contactEmail || "",
    logo_url: body.logoUrl || null,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await supabase
      .from("broker_settings")
      .update(row)
      .eq("id", existing.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await supabase
      .from("broker_settings")
      .insert(row);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
