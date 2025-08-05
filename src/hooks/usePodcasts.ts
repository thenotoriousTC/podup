import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';

type Podcast = Database['public']['Tables']['podcasts']['Row'];
export type Series = Database['public']['Tables']['series']['Row'];

// A new type for the Discover page content
export type DiscoverContent =
  | { type: 'podcasts'; title: string; data: Podcast[] }
  | { type: 'series'; title: string; data: (Series & { episode_count: number })[] };

// A new type for a series with its episodes
export type SeriesWithEpisodes = Series & {
  episodes: Podcast[];
  episode_count: number;
};

const categoryTranslations: { [key: string]: string } = {
  Comedy: 'كوميدي',
  Money: 'مال',
  Entertainment: 'ترفيه',
  Technology: 'تكنولوجيا',
  Science: 'علوم',
  Sports: 'رياضة',
  News: 'أخبار',
  'Health & Fitness': 'صحة ',
  Business: 'أعمال',
  Education: 'تعليم',
  Art: 'فن',
  History: 'تاريخ',
  Mix: 'متنوع',
};

export const usePodcasts = (searchQuery: string) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['discover_content'], // New query key
    queryFn: async () => {
      // Fetch series and podcasts in parallel
      const [seriesRes, podcastsRes] = await Promise.all([
        supabase.from('series').select('*').order('created_at', { ascending: false }),
        supabase.from('podcasts').select('*').order('created_at', { ascending: false }),
      ]);

      if (seriesRes.error) throw seriesRes.error;
      if (podcastsRes.error) throw podcastsRes.error;

      const allSeries = seriesRes.data || [];
      const allPodcasts = podcastsRes.data || [];

      // Separate standalone podcasts from episodes
      const standalonePodcasts = allPodcasts.filter(p => !p.series_id);
      
      // Add episode count to each series
      const seriesWithCount = allSeries.map(s => ({
          ...s,
          episode_count: allPodcasts.filter(p => p.series_id === s.id).length
      }));

      return { series: seriesWithCount, podcasts: standalonePodcasts };
    },
    staleTime: 300000, // 5 minutes
  });

  const discoverContent = useMemo((): DiscoverContent[] => {
    if (!data) return [];

    let { series, podcasts } = data;

    // Apply search filter
    if (searchQuery.trim()) {
        const lowercasedQuery = searchQuery.toLowerCase();
        series = series.filter(s => 
            s.title?.toLowerCase().includes(lowercasedQuery) ||
            s.description?.toLowerCase().includes(lowercasedQuery)
        );
        podcasts = podcasts.filter(p => 
            p.title?.toLowerCase().includes(lowercasedQuery) ||
            p.description?.toLowerCase().includes(lowercasedQuery) ||
            p.author?.toLowerCase().includes(lowercasedQuery)
        );
    }

    const content: DiscoverContent[] = [];

    // Add series section if they exist
    if (series.length > 0) {
      content.push({ type: 'series', title: 'سلاسل جديدة', data: series });
    }

    // Group standalone podcasts by category
    const groupedPodcasts = podcasts.reduce((acc, podcast) => {
      const category = podcast.category || 'Mix'; // Default to 'Mix' if no category
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(podcast);
      return acc;
    }, {} as Record<string, Podcast[]>);

    // Add a section for each category
    for (const category in groupedPodcasts) {
      const translatedTitle = categoryTranslations[category] || category;
      content.push({
        type: 'podcasts',
        title: translatedTitle,
        data: groupedPodcasts[category],
      });
    }

    return content;
  }, [data, searchQuery]);

  // Function to get a single series by ID with its episodes
  const getSeriesById = async (id: string): Promise<SeriesWithEpisodes | null> => {
    if (!id) return null;

    const { data: seriesData, error: seriesError } = await supabase
      .from('series')
      .select('*')
      .eq('id', id)
      .single();

    if (seriesError || !seriesData) {
      console.error('Error fetching series:', seriesError);
      return null;
    }

    const { data: episodesData, error: episodesError } = await supabase
      .from('podcasts')
      .select('*')
      .eq('series_id', id)
      .order('created_at', { ascending: false });

    if (episodesError) {
      console.error('Error fetching episodes:', episodesError);
      // Return series data even if episodes fail to load
    }
    
    return {
        ...seriesData,
        episodes: episodesData || [],
        episode_count: episodesData?.length || 0,
    };
  };

  const refreshDiscoverContent = () => {
    queryClient.invalidateQueries({ queryKey: ['discover_content'] });
  };

  const getSeriesByCreatorId = async (creatorId: string): Promise<(Series & { episode_count: number })[]> => {
    if (!creatorId) return [];

    const { data: seriesData, error: seriesError } = await supabase
      .from('series')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });

    if (seriesError) {
      console.error('Error fetching series by creator:', seriesError);
      return [];
    }

    if (!seriesData) {
        return [];
    }

    const seriesWithCount = await Promise.all(
        seriesData.map(async (s) => {
            const { count, error: countError } = await supabase
                .from('podcasts')
                .select('*', { count: 'exact', head: true })
                .eq('series_id', s.id);
            
            if (countError) {
                console.error(`Error fetching episode count for series ${s.id}:`, countError);
                return { ...s, episode_count: 0 };
            }

            return { ...s, episode_count: count || 0 };
        })
    );

    return seriesWithCount;
  };

  const getStandalonePodcastsByCreator = async (creatorId: string): Promise<Podcast[]> => {
    if (!creatorId) return [];

    const { data, error } = await supabase
      .from('podcasts')
      .select('*')
      .eq('user_id', creatorId)
      .is('series_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching standalone podcasts:', error);
      return [];
    }

    return data || [];
  };

  return {
    discoverContent,
    isLoading,
    error,
    totalResults: discoverContent.reduce((acc, section) => acc + section.data.length, 0),
    refreshPodcasts: refreshDiscoverContent, // Keep the same name for compatibility
    getSeriesById,
    getSeriesByCreatorId,
    getStandalonePodcastsByCreator,
  };
};