-- Add WordPress-style SEO fields for blog detail page
-- schema_code: JSON-LD or other schema markup (text)
-- og_image_name, featured_image_name: display/caption names for images

alter table public.blogs
  add column if not exists schema_code text,
  add column if not exists og_image_name varchar(255),
  add column if not exists featured_image_name varchar(255);
