-- Migration to update existing tables

-- Update Clips Table
alter table public.clips 
add column if not exists group_id uuid references public.groups(id),
add column if not exists tags text[] default '{}';

-- Allow Mixed type if not present (Postgres enums are harder to alter safely, but check constraint can be dropped/readded)
-- First drop existing check constraint if likely to conflict
alter table public.clips drop constraint if exists clips_type_check;
alter table public.clips add constraint clips_type_check 
  check (type in ('image', 'text', 'url', 'pdf', 'mixed'));

-- Ensure Groups table exists (Run this just in case, though CREATE IF NOT EXISTS in schema.sql should have handled it if it didn't exist)
create table if not exists public.groups (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  title text not null,
  color text default 'indigo',
  created_at timestamptz default now()
);

-- Re-apply RLS for Groups just in case check failed previously
alter table public.groups enable row level security;
