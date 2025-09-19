-- Step 1: Drop the conflicting function that accepts TEXT.
DROP FUNCTION IF EXISTS public.increment_view_count(podcast_id_to_update text);

-- Step 2: Drop the old function that accepts UUID to prepare for the new one.
DROP FUNCTION IF EXISTS public.increment_view_count(podcast_id_to_update uuid);

-- Step 3: Create the single, correct function with a UUID parameter and enhanced security.
CREATE OR REPLACE FUNCTION public.increment_view_count(podcast_id_to_update uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Set search path to an empty string for security
    SET search_path = '';
    
    -- Increment view count for the specified podcast, handling NULLs gracefully.
    UPDATE public.podcasts
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE id = podcast_id_to_update;
END;
$$;
