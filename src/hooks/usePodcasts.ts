import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { useOfflineCache } from './useOfflineCache';

type Podcast = Database['public']['Tables']['podcasts']['Row'];
export type Series = Database['public']['Tables']['series']['Row'];

// Series with episode count for discovery
export type SeriesWithCount = Series & { episode_count: number };

// A new type for the Discover page content
export type DiscoverContent =
  | { type: 'podcasts'; title: string; data: Podcast[] }
  | { type: 'series'; title: string; data: SeriesWithCount[] };

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
  
  // Local-first caching - only for empty search (main discover content)
  const shouldUseCache = searchQuery.trim() === '';
  const cacheKey = `discover_content_main`;
  const { cachedData, isStale, saveToCache } = useOfflineCache<{
    series: SeriesWithCount[];
    podcasts: Podcast[];
  }>({
    key: cacheKey,
    ttl: 300000, // 5 minutes
    fallbackData: { series: [], podcasts: [] }
  });

  // Use stable query key to prevent cache invalidation on every character
  const trimmedQuery = searchQuery.trim();
  const queryKey = trimmedQuery ? ['discover_content', 'search', trimmedQuery] : ['discover_content', 'main'];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const trimmedQuery = searchQuery.trim();
      
      // Define column selections to avoid select('*')
      const seriesColumns = 'id, title, description, cover_art_url, created_at, creator_id';
      const podcastColumns = 'id, title, description, author, category, audio_url, image_url, thumbnail_url, duration, view_count, series_id, created_at, user_id, local_audio_url, updated_at';
      
      let seriesQuery = supabase
        .from('series')
        .select(seriesColumns)
        .order('created_at', { ascending: false })
        .limit(50); // Add pagination limit
        
      let podcastQuery = supabase
        .from('podcasts')
        .select(podcastColumns)
        .order('created_at', { ascending: false })
        .limit(100); // Add pagination limit
      
      // Apply server-side filtering if search query exists
      if (trimmedQuery) {
        console.log('🔍 Applying search filter:', { 
          originalQuery: searchQuery, 
          trimmedQuery,
          shouldUseCache 
        });
        // Escape special PostgreSQL ILIKE pattern characters (%, _, \) to treat them as literals
        const escapedQuery = trimmedQuery.replace(/[%_\\]/g, '\\$&');
        seriesQuery = seriesQuery.or(`title.ilike.%${escapedQuery}%,description.ilike.%${escapedQuery}%`);
        podcastQuery = podcastQuery.or(`title.ilike.%${escapedQuery}%,description.ilike.%${escapedQuery}%,author.ilike.%${escapedQuery}%`);
        console.log('🔍 Search filters applied:', {
          seriesFilter: `title.ilike.%${escapedQuery}%,description.ilike.%${escapedQuery}%`,
          podcastFilter: `title.ilike.%${escapedQuery}%,description.ilike.%${escapedQuery}%,author.ilike.%${escapedQuery}%`
        });
      } else {
        console.log('📋 Loading main discover content (no search)');
      }
      
      // Execute queries in parallel
      const [seriesRes, podcastsRes] = await Promise.all([
        seriesQuery,
        podcastQuery,
      ]);

      if (seriesRes.error) throw seriesRes.error;
      if (podcastsRes.error) throw podcastsRes.error;

      const allSeries = seriesRes.data || [];
      const allPodcasts = podcastsRes.data || [];

      // Separate standalone podcasts from episodes
      const standalonePodcasts = allPodcasts.filter(p => !p.series_id);
      
      // Build a map of episode counts
      const episodeCounts = allPodcasts.reduce((acc, podcast) => {
        if (podcast.series_id) {
          acc[podcast.series_id] = (acc[podcast.series_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      // Add episode count to each series
      const seriesWithCount = allSeries.map(s => ({
          ...s,
          episode_count: episodeCounts[s.id] || 0
      }));

      const result = { 
        series: seriesWithCount as SeriesWithCount[], 
        podcasts: standalonePodcasts as Podcast[] 
      };
      
      console.log('📊 Query results:', {
        searchQuery: trimmedQuery || 'none',
        seriesCount: seriesWithCount.length,
        podcastsCount: standalonePodcasts.length,
        totalResults: seriesWithCount.length + standalonePodcasts.length
      });
      
      // Save to local cache for offline access (only for main discover content, not search results)
      if (shouldUseCache) {
        await saveToCache(result);
      }
      
      return result;
    },
    staleTime: 300000, // 5 minutes
    // Only use cached data for main discover content (not search results)
    initialData: (shouldUseCache && cachedData && !isStale && (cachedData.series?.length > 0 || cachedData.podcasts?.length > 0)) ? cachedData : undefined,
    // Keep previous data while fetching new results to prevent state reset
    placeholderData: (previousData, previousQuery) => previousData,
    // Reduce network requests frequency
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const discoverContent = useMemo((): DiscoverContent[] => {
    if (!data) return [];

    const { series, podcasts } = data;
    
    // No client-side filtering needed since server-side filtering is now applied

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
  const getSeriesById = useCallback(async (id: string): Promise<SeriesWithEpisodes | null> => {
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
  }, []);

  const refreshPodcasts = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['discover_content'] });
  }, [queryClient]);

  const getSeriesByCreatorId = useCallback(async (creatorId: string): Promise<(Series & { episode_count: number })[]> => {
    if (!creatorId || creatorId === 'create-series') return [];

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
  }, []);

  const getStandalonePodcastsByCreator = useCallback(async (creatorId: string): Promise<Podcast[]> => {
    if (!creatorId || creatorId === 'create-series') return [];

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
  }, []);

  return {
    discoverContent,
    isLoading,
    error,
    totalResults: discoverContent.reduce((acc, section) => acc + section.data.length, 0),
    refreshPodcasts, // Keep the same name for compatibility
    getSeriesById,
    getSeriesByCreatorId,
    getStandalonePodcastsByCreator,
  };
};