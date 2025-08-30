import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Hook to get library status for multiple podcasts
export const useLibraryStatus = (userId?: string, podcastIds?: string[]) => {
  const queryKey = ['libraryStatus', userId, podcastIds];

  const { data: libraryStatus, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!userId || !podcastIds || podcastIds.length === 0) {
        return {};
      }

      const { data, error } = await supabase
        .from('user-library')
        .select('podcast_id')
        .eq('user_id', userId)
        .in('podcast_id', podcastIds);

      if (error) {
        throw new Error(error.message);
      }

      const inLibrarySet = new Set(data.map((row) => row.podcast_id));
      const statusMap: { [key: string]: boolean } = {};
      podcastIds.forEach((id) => {
        statusMap[id] = inLibrarySet.has(id);
      });

      return statusMap;
    },
    enabled: !!userId && !!podcastIds && podcastIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    libraryStatus,
    isLoading,
  };
};

// Hook for the mutation (add/remove) logic
export const useLibraryMutation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ 
      podcastId, 
      userId, 
      isInLibrary 
    }: { 
      podcastId: string; 
      userId: string; 
      isInLibrary: boolean; 
    }) => {
      if (isInLibrary) {
        // Remove from library
        const { error } = await supabase
          .from('user-library')
          .delete()
          .eq('user_id', userId)
          .eq('podcast_id', podcastId);
        if (error) throw error;
      } else {
        // Add to library (idempotent)
        const { error } = await supabase
          .from('user-library')
          .upsert(
            { podcast_id: podcastId, user_id: userId },
            { onConflict: 'user_id,podcast_id', ignoreDuplicates: true }
          );
        if (error) throw error;
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate queries to refetch library status
      queryClient.invalidateQueries({ queryKey: ['libraryStatus'] });
      queryClient.invalidateQueries({ queryKey: ['my-library'] });
    },
  });

  return mutation;
};
