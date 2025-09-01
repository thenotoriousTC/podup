export interface Podcast {
  id: string;
  title: string;
  author: string;
  audio_url: string;
  local_audio_url?: string;
  image_url: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  description: string | null;
  category: string | null;
  created_at: string | null;
  view_count: number | null;
  user_id: string | null;
  series_id: string | null;
  updated_at: string | null;
}

export interface Track {
  id: string;
  url: string;
  title: string;
  artist: string;
  artwork?: string;
  duration?: number;
}
