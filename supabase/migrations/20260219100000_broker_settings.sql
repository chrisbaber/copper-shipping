-- Broker settings — single-row config for company info, payment, and contact
CREATE TABLE broker_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  zip text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  ein text NOT NULL DEFAULT '',
  mc_number text NOT NULL DEFAULT '',
  us_dot text NOT NULL DEFAULT '',
  bank_name text NOT NULL DEFAULT '',
  bank_account text NOT NULL DEFAULT '',
  bank_routing text NOT NULL DEFAULT '',
  submitted_by text NOT NULL DEFAULT '',
  contact_phone text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  logo_url text,
  updated_at timestamptz DEFAULT now()
);

-- Seed with KFB defaults
INSERT INTO broker_settings (
  company_name, address, city, state, zip, phone, email,
  ein, mc_number, us_dot,
  bank_name, bank_account, bank_routing,
  submitted_by, contact_phone, contact_email
) VALUES (
  'Kingdom Family Brokerage, Inc.', '7533 Kingsmill Terrace', 'Fort Worth', 'TX', '76112',
  '(682) 231-3575', 'Hlrolfe@dfwtrucking.com',
  '29-58805', '1750411', '4444213',
  'Bank of America', '488135011117', '111 000 025',
  'Henry L Wolfe', '(682) 231-3575', 'Hlrolfe@dfwtrucking.com'
);
