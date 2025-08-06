import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useSeriesFollows = (userId?: string, seriesIds?: string[]) => {
  const queryKey = ['seriesFollows', userId, seriesIds];

  const { data: followStatus, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!userId || !seriesIds || seriesIds.length === 0) {
        return {};
      }

      const { data, error } = await supabase
        .from('series_followers')
        .select('series_id')
        .eq('follower_id', userId)
        .in('series_id', seriesIds);

      if (error) {
        throw new Error(error.message);
      }

      const followedSet = new Set(data.map((row) => row.series_id));
      const statusMap: { [key: string]: boolean } = {};
      seriesIds.forEach((id) => {
        statusMap[id] = followedSet.has(id);
      });

      return statusMap;
    },
    enabled: !!userId && !!seriesIds && seriesIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    followStatus,
    isLoading,
  };
};
