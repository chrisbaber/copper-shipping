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
    .select("*, loads(*)")
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
      status: "created",
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

export async function PATCH(req: NextRequest) {
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  const body = await req.json();
  const loadId = body.loadId;

  if (!loadId) {
    return NextResponse.json({ error: "loadId required" }, { status: 400 });
  }

  // Update load fields if provided
  const loadUpdate: Record<string, unknown> = {};
  if (body.shipperName !== undefined) loadUpdate.shipper_name = body.shipperName;
  if (body.pickupAddress !== undefined) loadUpdate.pickup_address = body.pickupAddress;
  if (body.pickupDate !== undefined) loadUpdate.pickup_date = body.pickupDate || null;
  if (body.deliveryAddress !== undefined) loadUpdate.delivery_address = body.deliveryAddress;
  if (body.deliveryDate !== undefined) loadUpdate.delivery_date = body.deliveryDate || null;
  if (body.commodity !== undefined) loadUpdate.commodity = body.commodity;
  if (body.weight !== undefined) loadUpdate.weight = body.weight;
  if (body.carrierName !== undefined) loadUpdate.carrier_name = body.carrierName;

  if (Object.keys(loadUpdate).length > 0) {
    await supabase.from("loads").update(loadUpdate).eq("id", loadId);
  }

  // Update invoice fields
  const invoiceUpdate: Record<string, unknown> = {};
  if (body.invoiceNumber !== undefined) invoiceUpdate.invoice_number = body.invoiceNumber;
  if (body.billToName !== undefined) invoiceUpdate.bill_to_name = body.billToName;
  if (body.billToAddress !== undefined) invoiceUpdate.bill_to_address = body.billToAddress;
  if (body.linehaul !== undefined) invoiceUpdate.linehaul = body.linehaul;
  if (body.fuelSurcharge !== undefined) invoiceUpdate.fuel_surcharge = body.fuelSurcharge;
  if (body.accessorial !== undefined) invoiceUpdate.accessorial = body.accessorial;
  if (body.totalAmount !== undefined) invoiceUpdate.total_amount = body.totalAmount;
  if (body.emailSentTo) {
    invoiceUpdate.status = "sent";
    invoiceUpdate.sent_at = new Date().toISOString();
    invoiceUpdate.sent_to_email = body.emailSentTo;
  }

  if (Object.keys(invoiceUpdate).length > 0) {
    const { error } = await supabase
      .from("invoices")
      .update(invoiceUpdate)
      .eq("load_id", loadId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
