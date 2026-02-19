export interface Load {
  id: string;
  load_number: string;
  status: 'created' | 'tendered' | 'accepted' | 'in_transit' | 'delivered' | 'invoiced' | 'paid';
  shipper_name: string | null;
  shipper_address: string | null;
  shipper_contact_name: string | null;
  shipper_contact_email: string | null;
  shipper_contact_phone: string | null;
  pickup_address: string | null;
  pickup_date: string | null;
  pickup_time: string | null;
  delivery_address: string | null;
  delivery_date: string | null;
  delivery_time: string | null;
  commodity: string | null;
  weight: string | null;
  quantity: string | null;
  equipment: string | null;
  carrier_name: string | null;
  carrier_mc: string | null;
  carrier_dot: string | null;
  truck_number: string | null;
  driver_name: string | null;
  shipper_rate: number | null;
  carrier_rate: number | null;
  margin: number | null;
  bol_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  load_id: string | null;
  invoice_number: string;
  bill_to_name: string | null;
  bill_to_address: string | null;
  linehaul: number | null;
  fuel_surcharge: number | null;
  accessorial: number | null;
  total_amount: number | null;
  status: 'draft' | 'sent' | 'paid';
  sent_at: string | null;
  paid_at: string | null;
  pdf_url: string | null;
  sent_to_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  load_id: string | null;
  type: 'bol' | 'pod' | 'rate_confirmation' | 'invoice' | 'other';
  file_url: string;
  file_name: string | null;
  extracted_data: Record<string, unknown> | null;
  created_at: string;
}
