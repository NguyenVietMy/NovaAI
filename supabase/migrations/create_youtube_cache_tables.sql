-- Create YouTube cache tables for storing AI-generated content

-- YouTube transcript cache table
CREATE TABLE IF NOT EXISTS public.youtube_transcript_cache (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    video_id text NOT NULL UNIQUE,
    url text NOT NULL,
    output jsonb NOT NULL,
    user_id text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    CONSTRAINT youtube_transcript_cache_pkey PRIMARY KEY (id),
    CONSTRAINT youtube_transcript_cache_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- YouTube script cache table
CREATE TABLE IF NOT EXISTS public.youtube_script_cache (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id text,
    input_params jsonb,
    output jsonb,
    version integer NOT NULL DEFAULT 1,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT youtube_script_cache_pkey PRIMARY KEY (id),
    CONSTRAINT youtube_script_cache_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- YouTube outline cache table
CREATE TABLE IF NOT EXISTS public.youtube_outline_cache (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id text,
    input_params jsonb,
    output jsonb,
    version integer NOT NULL DEFAULT 1,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT youtube_outline_cache_pkey PRIMARY KEY (id),
    CONSTRAINT youtube_outline_cache_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Create indexes for efficient querying
CREATE INDEX idx_youtube_transcript_cache_video_id ON public.youtube_transcript_cache(video_id);
CREATE INDEX idx_youtube_transcript_cache_user_id ON public.youtube_transcript_cache(user_id);
CREATE INDEX idx_youtube_transcript_cache_created_at ON public.youtube_transcript_cache(created_at);

CREATE INDEX idx_youtube_script_cache_user_id ON public.youtube_script_cache(user_id);
CREATE INDEX idx_youtube_script_cache_is_active ON public.youtube_script_cache(is_active);
CREATE INDEX idx_youtube_script_cache_created_at ON public.youtube_script_cache(created_at);

CREATE INDEX idx_youtube_outline_cache_user_id ON public.youtube_outline_cache(user_id);
CREATE INDEX idx_youtube_outline_cache_is_active ON public.youtube_outline_cache(is_active);
CREATE INDEX idx_youtube_outline_cache_created_at ON public.youtube_outline_cache(created_at);

-- Enable RLS
ALTER TABLE public.youtube_transcript_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_script_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_outline_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for youtube_transcript_cache
CREATE POLICY "Users can view own transcript cache" ON public.youtube_transcript_cache
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own transcript cache" ON public.youtube_transcript_cache
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own transcript cache" ON public.youtube_transcript_cache
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own transcript cache" ON public.youtube_transcript_cache
    FOR DELETE USING (auth.uid()::text = user_id);

-- RLS Policies for youtube_script_cache
CREATE POLICY "Users can view own script cache" ON public.youtube_script_cache
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own script cache" ON public.youtube_script_cache
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own script cache" ON public.youtube_script_cache
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own script cache" ON public.youtube_script_cache
    FOR DELETE USING (auth.uid()::text = user_id);

-- RLS Policies for youtube_outline_cache
CREATE POLICY "Users can view own outline cache" ON public.youtube_outline_cache
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own outline cache" ON public.youtube_outline_cache
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own outline cache" ON public.youtube_outline_cache
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own outline cache" ON public.youtube_outline_cache
    FOR DELETE USING (auth.uid()::text = user_id); 