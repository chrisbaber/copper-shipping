-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Loads table (core entity)
create table loads (
  id uuid primary key default uuid_generate_v4(),
  load_number text not null,
  status text not null default 'created' check (status in ('created','tendered','accepted','in_transit','delivered','invoiced','paid')),
  
  -- Shipper info
  shipper_name text,
  shipper_address text,
  shipper_contact_name text,
  shipper_contact_email text,
  shipper_contact_phone text,
  
  -- Pickup
  pickup_address text,
  pickup_date date,
  pickup_time text,
  
  -- Delivery  
  delivery_address text,
  delivery_date date,
  delivery_time text,
  
  -- Freight details
  commodity text,
  weight text,
  quantity text,
  equipment text,
  
  -- Carrier info
  carrier_name text,
  carrier_mc text,
  carrier_dot text,
  truck_number text,
  driver_name text,
  
  -- Financials
  shipper_rate numeric(10,2),
  carrier_rate numeric(10,2),
  margin numeric(10,2) generated always as (shipper_rate - carrier_rate) stored,
  
  -- Metadata
  bol_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Invoices table
create table invoices (
  id uuid primary key default uuid_generate_v4(),
  load_id uuid references loads(id) on delete cascade,
  invoice_number text not null,
  
  -- Bill-to
  bill_to_name text,
  bill_to_address text,
  
  -- Amounts
  linehaul numeric(10,2),
  fuel_surcharge numeric(10,2) default 0,
  accessorial numeric(10,2) default 0,
  total_amount numeric(10,2),
  
  -- Status
  status text not null default 'draft' check (status in ('draft','sent','paid')),
  sent_at timestamptz,
  paid_at timestamptz,
  
  -- Storage
  pdf_url text,
  
  -- Email
  sent_to_email text,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Documents table (BOL photos, PODs, etc.)
create table documents (
  id uuid primary key default uuid_generate_v4(),
  load_id uuid references loads(id) on delete cascade,
  type text not null check (type in ('bol','pod','rate_confirmation','invoice','other')),
  file_url text not null,
  file_name text,
  extracted_data jsonb,
  created_at timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger loads_updated_at before update on loads
  for each row execute function update_updated_at();

create trigger invoices_updated_at before update on invoices
  for each row execute function update_updated_at();

-- Indexes
create index idx_loads_status on loads(status);
create index idx_loads_created_at on loads(created_at desc);
create index idx_invoices_load_id on invoices(load_id);
create index idx_invoices_status on invoices(status);
create index idx_documents_load_id on documents(load_id);
create index idx_documents_type on documents(type);
