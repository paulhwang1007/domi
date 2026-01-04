-- Verify Indexes
-- Run this to see if the indexes were actually created.

SELECT 
    schemaname, 
    tablename, 
    indexname, 
    indexdef
FROM pg_indexes
WHERE tablename IN ('clips', 'groups', 'profiles')
AND indexname IN ('idx_groups_user_id', 'idx_clips_user_id', 'idx_clips_group_id', 'groups_pkey', 'clips_pkey', 'profiles_pkey');
