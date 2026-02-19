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

export async function GET() {
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ data: [] });
  }

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  const body = await req.json();

  // Create the load first
  const { data: load, error: loadError } = await supabase
    .from("loads")
    .insert({
      load_number: body.invoiceNumber || `KFB-${Date.now()}`,
      status: "invoiced",
      shipper_name: body.shipperName,
      shipper_address: body.shipperAddress,
      pickup_address: body.pickupAddress,
      pickup_date: body.pickupDate || null,
      delivery_address: body.deliveryAddress,
      delivery_date: body.deliveryDate || null,
      commodity: body.commodity,
      weight: body.weight,
      carrier_name: body.carrierName,
      carrier_mc: body.carrierMc,
      truck_number: body.truckNumber,
      shipper_rate: body.totalAmount || null,
      bol_number: body.bolNumber,
    })
    .select()
    .single();

  if (loadError) {
    return NextResponse.json({ error: loadError.message }, { status: 500 });
  }

  // Create the invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      load_id: load.id,
      invoice_number: body.invoiceNumber,
      bill_to_name: body.billToName,
      bill_to_address: body.billToAddress,
      linehaul: body.linehaul || null,
      fuel_surcharge: body.fuelSurcharge || 0,
      accessorial: body.accessorial || 0,
      total_amount: body.totalAmount || null,
      status: body.emailSentTo ? "sent" : "draft",
      sent_at: body.emailSentTo ? new Date().toISOString() : null,
      sent_to_email: body.emailSentTo || null,
    })
    .select()
    .single();

  if (invoiceError) {
    return NextResponse.json({ error: invoiceError.message }, { status: 500 });
  }

  // Save extracted BOL data as a document if provided
  if (body.extractedData) {
    await supabase.from("documents").insert({
      load_id: load.id,
      type: "bol",
      file_url: "uploaded-via-browser",
      file_name: body.fileName || "bol-upload.jpg",
      extracted_data: body.extractedData,
    });
  }

  return NextResponse.json({ data: { load, invoice } });
}
