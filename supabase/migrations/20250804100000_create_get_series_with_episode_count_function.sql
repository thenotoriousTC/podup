CREATE OR REPLACE FUNCTION get_series_with_episode_count(p_creator_id uuid)
RETURNS TABLE (
  id uuid,
  created_at timestamp with time zone,
  title text,
  description text,
  cover_image_url text,
  creator_id uuid,
  category text,
  episode_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.created_at,
    s.title,
    s.description,
    s.cover_image_url,
    s.creator_id,
    s.category,
    COALESCE(p_counts.episode_count, 0) AS episode_count
  FROM
    series s
  LEFT JOIN (
    SELECT
      series_id,
      COUNT(*) AS episode_count
    FROM
      podcasts
    GROUP BY
      series_id
  ) AS p_counts ON s.id = p_counts.series_id
  WHERE
    s.creator_id = p_creator_id
  ORDER BY
    s.created_at DESC;
END;
$$ LANGUAGE plpgsql;
