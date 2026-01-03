-- Storage Policies for 'domi-uploads' bucket

-- 1. Allow Public Read Access (so images show up in the dashboard)
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'domi-uploads' );

-- 2. Allow Authenticated Users to Upload Files
create policy "Authenticated users can upload"
on storage.objects for insert
with check (
  bucket_id = 'domi-uploads'
  and auth.role() = 'authenticated'
);

-- 3. Allow Users to Update their own files
create policy "Users can update own files"
on storage.objects for update
using ( auth.uid() = owner )
with check ( bucket_id = 'domi-uploads' );

-- 4. Allow Users to Delete their own files
create policy "Users can delete own files"
on storage.objects for delete
using ( auth.uid() = owner and bucket_id = 'domi-uploads' );
