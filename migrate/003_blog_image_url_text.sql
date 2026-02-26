-- Allow long image URLs (e.g. data URLs from admin image picker)
-- varchar(500) is too short for base64 data URLs
alter table public.blogs
  alter column featured_image_url type text;

-- Optional: if og_image_url exists and you use it
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'blogs' and column_name = 'og_image_url'
  ) then
    alter table public.blogs alter column og_image_url type text;
  end if;
end $$;
