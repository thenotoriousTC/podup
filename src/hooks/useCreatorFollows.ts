import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useCreatorFollows = (userId?: string, creatorIds?: string[]) => {
  const queryKey = ['creatorFollows', userId, creatorIds];

  const { data: followStatus, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!userId || !creatorIds || creatorIds.length === 0) {
        return {};
      }

      const { data, error } = await supabase
        .from('creator_followers')
        .select('followed_id')
        .eq('follower_id', userId)
        .in('followed_id', creatorIds);

      if (error) {
        throw new Error(error.message);
      }

      const followedSet = new Set(data.map((row) => row.followed_id));
      const statusMap: { [key: string]: boolean } = {};
      creatorIds.forEach((id) => {
        statusMap[id] = followedSet.has(id);
      });

      return statusMap;
    },
    enabled: !!userId && !!creatorIds && creatorIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    followStatus,
    isLoading,
  };
};
