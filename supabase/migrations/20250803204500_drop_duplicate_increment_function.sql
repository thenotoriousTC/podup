-- Drop the conflicting increment_view_count function that accepts a text parameter.
DROP FUNCTION IF EXISTS public.increment_view_count(podcast_id_to_update text);
