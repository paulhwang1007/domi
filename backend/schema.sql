-- Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Clips Table
create table if not exists public.clips (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  type text not null check (type in ('image', 'text', 'url', 'mixed')),
  content text, -- raw text, or validation for url
  src_url text,
  title text,
  description text,
  is_favorite boolean default false,
  status text default 'pending', -- pending, processed, error
  metadata jsonb default '{}'::jsonb, -- store extra AI analysis here
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.clips enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

create policy "Users can view own clips."
  on clips for select
  using ( auth.uid() = user_id );

create policy "Users can insert own clips."
  on clips for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own clips."
  on clips for update
  using ( auth.uid() = user_id );

create policy "Users can delete own clips."
  on clips for delete
  using ( auth.uid() = user_id );
