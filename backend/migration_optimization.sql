-- Optimization Migration

-- Add indexes to foreign keys to speed up RLS and Joins
create index if not exists idx_groups_user_id on public.groups(user_id);
create index if not exists idx_clips_user_id on public.clips(user_id);
create index if not exists idx_clips_group_id on public.clips(group_id);

-- Note: user_id is heavily used in RLS policies (auth.uid() = user_id)
-- Without these indexes, every query performs a sequential scan.
