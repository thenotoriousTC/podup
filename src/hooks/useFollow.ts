import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';

type UseFollowProps = {
  userId?: string;
  creatorId?: string;
  podcastId?: string;
  seriesId?: string; 
};

export const useFollow = ({ userId, creatorId, podcastId, seriesId }: UseFollowProps) => {
  const queryClient = useQueryClient();

  const followType = creatorId ? 'creator' : seriesId ? 'series' : 'podcast';
  const targetId = creatorId || seriesId || podcastId;

  const getTableDetails = () => {
    switch (followType) {
      case 'creator':
        return { tableName: 'creator_followers', columnName: 'followed_id' };
      case 'series':
        return { tableName: 'series_followers', columnName: 'series_id' };
      case 'podcast':
      default:
        return { tableName: 'podcast_followers', columnName: 'podcast_id' };
    }
  };

  const { tableName, columnName } = getTableDetails();

  const queryKey = ['followStatus', followType, targetId, userId];

  // Fetch the current follow status
  const { data: isFollowing, isLoading: isLoadingStatus } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!userId || !targetId) return false;

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('follower_id', userId)
        .eq(columnName, targetId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116: 'exact one row not found'
        throw new Error(error.message);
      }

      return !!data;
    },
    enabled: !!userId && !!targetId,
  });

  // Fetch the total number of followers
  const { data: followersCount, isLoading: isLoadingCount } = useQuery({
    queryKey: ['followersCount', followType, targetId],
    queryFn: async () => {
      if (!targetId) return 0;

      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .eq(columnName, targetId);

      if (error) {
        throw new Error(error.message);
      }

      return count || 0;
    },
    enabled: !!targetId,
  });

  // Mutation to follow
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !targetId) throw new Error('User or target ID is missing');

      const { error } = await supabase.from(tableName).insert({
        follower_id: userId,
        [columnName]: targetId,
      } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['followersCount', followType, targetId] });
    },
  });

  // Mutation to unfollow
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !targetId) throw new Error('User or target ID is missing');

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('follower_id', userId)
        .eq(columnName, targetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['followersCount', followType, targetId] });
    },
  });

  const toggleFollow = () => {
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  return {
    isFollowing,
    followersCount,
    toggleFollow,
    isLoading: isLoadingStatus || isLoadingCount,
    isToggling: followMutation.isPending || unfollowMutation.isPending,
  };
};
