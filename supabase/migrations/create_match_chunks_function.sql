-- Function to match chunks based on embedding similarity
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  video_id_param text
)
RETURNS TABLE (
  id uuid,
  video_id text,
  chunk_id text,
  start_sec integer,
  end_sec integer,
  text text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ytc.id,
    ytc.video_id,
    ytc.chunk_id,
    ytc.start_sec,
    ytc.end_sec,
    ytc.text,
    1 - (ytc.embedding <=> query_embedding) AS similarity
  FROM youtube_transcript_chunks ytc
  WHERE ytc.video_id = video_id_param
    AND 1 - (ytc.embedding <=> query_embedding) > match_threshold
  ORDER BY ytc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$; 