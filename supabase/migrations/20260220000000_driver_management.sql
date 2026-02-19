-- Profiles table (links auth users to roles + driver truck info)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null default '',
  role text not null default 'broker' check (role in ('broker', 'driver')),
  phone text,
  mc_number text,
  dot_number text,
  truck_number text,
  truck_tag text,
  equipment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_role on profiles(role);
create index idx_profiles_email on profiles(email);

create trigger profiles_updated_at before update on profiles
  for each row execute function update_updated_at();

-- Driver invitations table
create table driver_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null,
  phone text,
  mc_number text,
  dot_number text,
  truck_number text,
  truck_tag text,
  equipment text,
  invite_token uuid not null default gen_random_uuid(),
  state text not null default 'pending' check (state in ('pending', 'accepted', 'expired')),
  invited_by uuid references auth.users(id),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create unique index idx_driver_invitations_token on driver_invitations(invite_token);
create index idx_driver_invitations_email on driver_invitations(email);
create index idx_driver_invitations_state on driver_invitations(state);

-- Add driver pipeline columns to loads
alter table loads
  add column driver_id uuid references profiles(id),
  add column tendered_at timestamptz,
  add column accepted_at timestamptz,
  add column picked_up_at timestamptz,
  add column delivered_at timestamptz;

create index idx_loads_driver_id on loads(driver_id);

-- Seed broker profile for existing user(s)
insert into profiles (id, email, name, role)
select id, email, coalesce(raw_user_meta_data->>'name', 'Henry Wolfe'), 'broker'
from auth.users
on conflict (id) do nothing;
