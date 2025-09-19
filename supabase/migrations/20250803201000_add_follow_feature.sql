-- Migration to add follow feature for creators and podcasts

-- Table to store creator follow relationships
CREATE TABLE public.creator_followers (
    follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    followed_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (follower_id, followed_id)
);

-- Add comments to the table and columns
COMMENT ON TABLE public.creator_followers IS 'Stores the many-to-many relationship between users who follow creators.';
COMMENT ON COLUMN public.creator_followers.follower_id IS 'The user who is following.';
COMMENT ON COLUMN public.creator_followers.followed_id IS 'The creator being followed.';

-- Table to store podcast follow relationships
CREATE TABLE public.podcast_followers (
    follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    podcast_id uuid NOT NULL REFERENCES public.podcasts(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (follower_id, podcast_id)
);

-- Add comments to the table and columns
COMMENT ON TABLE public.podcast_followers IS 'Stores the many-to-many relationship between users who follow podcasts.';
COMMENT ON COLUMN public.podcast_followers.follower_id IS 'The user who is following.';
COMMENT ON COLUMN public.podcast_followers.podcast_id IS 'The podcast being followed.';

-- Enable Row Level Security (RLS)
ALTER TABLE public.creator_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.podcast_followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for creator_followers
CREATE POLICY "Users can view all creator follow relationships." ON public.creator_followers FOR SELECT USING (true);
CREATE POLICY "Users can follow/unfollow creators." ON public.creator_followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can only remove their own follow relationships." ON public.creator_followers FOR DELETE USING (auth.uid() = follower_id);

-- RLS Policies for podcast_followers
CREATE POLICY "Users can view all podcast follow relationships." ON public.podcast_followers FOR SELECT USING (true);
CREATE POLICY "Users can follow/unfollow podcasts." ON public.podcast_followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can only remove their own follow relationships." ON public.podcast_followers FOR DELETE USING (auth.uid() = follower_id);
