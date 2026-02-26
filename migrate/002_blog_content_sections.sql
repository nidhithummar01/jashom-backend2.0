-- Migration: multiple sections, each with optional multiple images
-- content_sections: array of { "title": "...", "content": "...", "images": [ { "url", "alt", "name" }, ... ] }
alter table public.blogs add column if not exists content_sections jsonb default '[]';
