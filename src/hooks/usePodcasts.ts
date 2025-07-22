import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/lib/supabase';

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
    queryKey: ['podcasts'],
    queryFn: async () => {
      const result = await supabase
        .from('podcasts')
        .select('*')
        .order('created_at', { ascending: false }) // Add ordering for newest first
        .throwOnError();
      
      console.log('Fetched podcasts from database:', result.data?.length || 0);
      return result;
    },
    // Add these options to improve data freshness
    staleTime: 0, // Consider data stale immediately
  });

  const groupedPodcasts = useMemo(() => {
    if (!data?.data) return [];
    // Filter out podcasts that do not have a user_id
    let podcasts = data.data.filter(p => p.user_id);

    if (searchQuery.trim()) {
      podcasts = podcasts.filter((podcast) =>
        podcast.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        podcast.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        podcast.author?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const grouped = podcasts.reduce((acc, podcast) => {
      const category = podcast.category || 'Mix';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(podcast);
      return acc;
    }, {});

    return Object.keys(grouped).map(category => ({
      title: categoryTranslations[category] || category,
      data: grouped[category],
    }));
  }, [data?.data, searchQuery]);

  // Add a function to manually refresh the data
  const refreshPodcasts = () => {
    queryClient.invalidateQueries({ queryKey: ['podcasts'] });
  };

  return {
    groupedPodcasts,
    isLoading,
    error,
    totalResults: groupedPodcasts.reduce((acc, section) => acc + section.data.length, 0),
    refreshPodcasts, // Export the refresh function
  };
};