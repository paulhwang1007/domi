-- Security Hardening Migration

-- 1. Fix Profiles Privacy (Prevent public email exposure)
drop policy if exists "Public profiles are viewable by everyone." on profiles;

create policy "Users can only view their own profile"
  on profiles for select
  using ( auth.uid() = id );

-- 2. Fix Storage Privacy (Disable public read access)
-- Note: This assumes we want files to be private. 
-- If an image is used in a public context later, we will need signed URLs.
drop policy if exists "Public Access" on storage.objects;

create policy "Users can view own files"
on storage.objects for select
using ( auth.uid() = owner and bucket_id = 'domi-uploads' );
