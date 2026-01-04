-- Optimizing RLS Policies to prevent per-row evaluation of auth.uid()

-- PROFILES
drop policy if exists "Users can only view their own profile" on profiles;
create policy "Users can only view their own profile"
  on profiles for select
  using ( (select auth.uid()) = id );

drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile."
  on profiles for insert
  with check ( (select auth.uid()) = id );

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile."
  on profiles for update
  using ( (select auth.uid()) = id );

-- GROUPS
drop policy if exists "Users can view own groups." on groups;
create policy "Users can view own groups."
  on groups for select
  using ( (select auth.uid()) = user_id );

drop policy if exists "Users can insert own groups." on groups;
create policy "Users can insert own groups."
  on groups for insert
  with check ( (select auth.uid()) = user_id );

drop policy if exists "Users can update own groups." on groups;
create policy "Users can update own groups."
  on groups for update
  using ( (select auth.uid()) = user_id );

drop policy if exists "Users can delete own groups." on groups;
create policy "Users can delete own groups."
  on groups for delete
  using ( (select auth.uid()) = user_id );

-- CLIPS
drop policy if exists "Users can view own clips." on clips;
create policy "Users can view own clips."
  on clips for select
  using ( (select auth.uid()) = user_id );

drop policy if exists "Users can insert own clips." on clips;
create policy "Users can insert own clips."
  on clips for insert
  with check ( (select auth.uid()) = user_id );

drop policy if exists "Users can update own clips." on clips;
create policy "Users can update own clips."
  on clips for update
  using ( (select auth.uid()) = user_id );

drop policy if exists "Users can delete own clips." on clips;
create policy "Users can delete own clips."
  on clips for delete
  using ( (select auth.uid()) = user_id );

-- STORAGE
drop policy if exists "Users can view own files" on storage.objects;
create policy "Users can view own files"
  on storage.objects for select
  using ( (select auth.uid()) = owner and bucket_id = 'domi-uploads' );
