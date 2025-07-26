-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the youtube_transcript_chunks table
CREATE TABLE public.youtube_transcript_chunks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  video_id text NOT NULL,
  chunk_id text NOT NULL, -- Format: ${videoId}-${startSec}
  start_sec integer NOT NULL,
  end_sec integer NOT NULL,
  text text NOT NULL,
  embedding vector(1536), -- text-embedding-3-small dimension
  created_at timestamp with time zone DEFAULT now(),
  user_id text,
  CONSTRAINT youtube_transcript_chunks_pkey PRIMARY KEY (id),
  CONSTRAINT youtube_transcript_chunks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Create indexes for efficient querying
CREATE INDEX idx_youtube_transcript_chunks_video_id ON public.youtube_transcript_chunks(video_id);
CREATE INDEX idx_youtube_transcript_chunks_chunk_id ON public.youtube_transcript_chunks(chunk_id);
CREATE INDEX idx_youtube_transcript_chunks_video_chunk ON public.youtube_transcript_chunks(video_id, chunk_id);
CREATE INDEX idx_youtube_transcript_chunks_user_id ON public.youtube_transcript_chunks(user_id);

-- Create vector index for similarity search
CREATE INDEX idx_youtube_transcript_chunks_embedding ON public.youtube_transcript_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Add unique constraint to prevent duplicate chunks
CREATE UNIQUE INDEX idx_youtube_transcript_chunks_unique ON public.youtube_transcript_chunks(video_id, chunk_id); 