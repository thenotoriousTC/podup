import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/lib/supabase';

export const usePodcasts = (searchQuery: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['podcasts'],
    queryFn: async () => supabase.from('podcasts').select('*').throwOnError(),
  });

  const groupedPodcasts = useMemo(() => {
    if (!data?.data) return [];
    let podcasts = data.data;

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
      title: category,
      data: grouped[category],
    }));
  }, [data?.data, searchQuery]);

  return {
    groupedPodcasts,
    isLoading,
    error,
    totalResults: groupedPodcasts.reduce((acc, section) => acc + section.data.length, 0)
  };
};
