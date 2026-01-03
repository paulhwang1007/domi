-- Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Groups Table
create table if not exists public.groups (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  title text not null,
  color text default 'indigo',
  created_at timestamptz default now()
);

-- Clips Table
create table if not exists public.clips (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  group_id uuid references public.groups(id),
  type text not null check (type in ('image', 'text', 'url', 'pdf', 'mixed')), 
  content text, 
  src_url text,
  title text,
  description text,
  tags text[] default '{}',
  is_favorite boolean default false,
  status text default 'pending', 
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.clips enable row level security;
alter table public.groups enable row level security;

-- Policies: Profiles
drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Policies: Groups
drop policy if exists "Users can view own groups." on groups;
create policy "Users can view own groups."
  on groups for select
  using ( auth.uid() = user_id );

drop policy if exists "Users can insert own groups." on groups;
create policy "Users can insert own groups."
  on groups for insert
  with check ( auth.uid() = user_id );

drop policy if exists "Users can update own groups." on groups;
create policy "Users can update own groups."
  on groups for update
  using ( auth.uid() = user_id );

drop policy if exists "Users can delete own groups." on groups;
create policy "Users can delete own groups."
  on groups for delete
  using ( auth.uid() = user_id );

-- Policies: Clips
drop policy if exists "Users can view own clips." on clips;
create policy "Users can view own clips."
  on clips for select
  using ( auth.uid() = user_id );

drop policy if exists "Users can insert own clips." on clips;
create policy "Users can insert own clips."
  on clips for insert
  with check ( auth.uid() = user_id );

drop policy if exists "Users can update own clips." on clips;
create policy "Users can update own clips."
  on clips for update
  using ( auth.uid() = user_id );

drop policy if exists "Users can delete own clips." on clips;
create policy "Users can delete own clips."
  on clips for delete
  using ( auth.uid() = user_id );
