-- Migration: create blogs table for Jashom (PostgreSQL)
-- Run in Supabase: SQL Editor → New query → paste and Run

-- Status enum (skip if already exists so migration is re-runnable)
do $$ begin
  if not exists (select 1 from pg_type where typname = 'blog_status') then
    create type blog_status as enum ('draft', 'published', 'archived');
  end if;
end $$;

create table if not exists public.blogs (
  id serial primary key,
  title varchar(255) not null,
  slug varchar(255) unique not null,
  excerpt text,
  content text not null,
  author_id int,
  author_name varchar(100),
  tags text,
  status blog_status default 'draft',
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- SEO
  meta_title varchar(70),
  meta_description text,
  canonical_url varchar(255),
  meta_robots varchar(50) default 'index, follow',

  -- Open Graph
  og_image_url varchar(500),
  og_image_alt varchar(255),

  -- Featured image
  featured_image_url varchar(500),
  featured_image_alt varchar(255),

  -- Behavior & display
  view_count int default 0,
  is_featured boolean default false,
  is_pinned boolean default false,
  sort_order int default 0,
  allow_comments boolean default false
);

-- Indexes (if not exists so migration is re-runnable)
create index if not exists idx_blogs_slug on public.blogs (slug);
create index if not exists idx_blogs_status on public.blogs (status);
create index if not exists idx_blogs_published_at on public.blogs (published_at);
create index if not exists idx_blogs_author_id on public.blogs (author_id);

-- Trigger: set updated_at on row update
create or replace function public.set_blogs_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists blogs_updated_at on public.blogs;
create trigger blogs_updated_at
  before update on public.blogs
  for each row execute function public.set_blogs_updated_at();

alter table public.blogs enable row level security;
