-- Migration: create authors table with Jay Dave and Soham Thaker

create table if not exists public.authors (
  id serial primary key,
  name varchar(100) not null,
  slug varchar(100) unique not null,
  role varchar(150),
  bio text,
  avatar_url varchar(500),
  linkedin_url varchar(500),
  twitter_url varchar(500),
  created_at timestamptz default now()
);

-- Seed authors
insert into public.authors (name, slug, role, bio, linkedin_url) values
(
  'Jay Dave',
  'jay-dave',
  'Founder & CEO, Jashom Technologies',
  'Jay Dave is the Founder and CEO of Jashom Technologies, a specialized GPU engineering company.

Jashom helps AI startups, research organizations, and enterprises accelerate compute-intensive workloads through advanced CUDA development and GPU optimization — building scalable, production-ready infrastructure for AI models, simulations, and large-scale data processing.

Jay writes about GPU computing, AI infrastructure, and the engineering challenges of scaling high-performance systems.',
  'https://www.linkedin.com/in/jay-dave/'
),
(
  'Soham Thaker',
  'soham-thaker',
  'Technical Lead, Jashom Technologies',
  'Soham Thaker is the Technical Lead at Jashom Technologies, a technology company building scalable AI and digital solutions — from custom LLM applications and RAG systems to GPU-optimized computing and full-stack engineering.

With a background spanning system architecture, Rust development and technical team leadership, Soham focuses on turning complex technical requirements into reliable, production-ready systems.

He writes about AI engineering, system design, and the practical challenges of building at scale.',
  'https://www.linkedin.com/in/soham-thaker/'
)
on conflict (slug) do nothing;
