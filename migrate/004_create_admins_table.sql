-- Migration: create admins table for Jashom (PostgreSQL)
-- Run via: npm run migration

create table if not exists public.admins (
  id serial primary key,
  email varchar(255) unique not null,
  password_hash varchar(255) not null,
  name varchar(100),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_admins_email on public.admins (email);

create or replace function public.set_admins_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists admins_updated_at on public.admins;
create trigger admins_updated_at
  before update on public.admins
  for each row execute function public.set_admins_updated_at();
