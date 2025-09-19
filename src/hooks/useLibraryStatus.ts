import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Hook to get library status for multiple podcasts
export const useLibraryStatus = (userId?: string, podcastIds?: string[]) => {
  const queryKey = ['libraryStatus', userId, podcastIds];

  const { data: libraryStatus, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      console.log('📚 useLibraryStatus queryFn:', { userId, podcastIdsLength: podcastIds?.length });
      
      if (!userId || !podcastIds || podcastIds.length === 0) {
        console.log('❌ useLibraryStatus: Missing userId or podcastIds');
        return {};
      }

      console.log('🔍 Querying user-library table:', { userId, podcastIds });
      const { data, error } = await supabase
        .from('user-library')
        .select('podcast_id')
        .eq('user_id', userId)
        .in('podcast_id', podcastIds);

      if (error) {
        console.error('❌ useLibraryStatus query error:', error);
        throw new Error(error.message);
      }

      console.log('✅ useLibraryStatus query result:', { dataLength: data?.length, data });
      
      const rows = data ?? [];
      const inLibrarySet = new Set(rows.map((row) => row.podcast_id));
      const statusMap: Record<string, boolean> = Object.fromEntries(
        (podcastIds ?? []).map((id) => [id, inLibrarySet.has(id)])
      );
      console.log('📊 useLibraryStatus statusMap:', statusMap);
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
      console.log('🔄 useLibraryMutation mutationFn:', { podcastId, userId, isInLibrary });
      
      if (isInLibrary) {
        // Remove from library
        console.log('🗑️ Removing from library:', { podcastId, userId });
        const { error, data } = await supabase
          .from('user-library')
          .delete()
          .eq('user_id', userId)
          .eq('podcast_id', podcastId)
          .select();
          
        console.log('🗑️ Delete result:', { error, data });
        if (error) {
          console.error('❌ Delete error:', error);
          throw error;
        }
      } else {
        // Add to library (idempotent)
        console.log('➕ Adding to library:', { podcastId, userId });
        const { error, data } = await supabase
          .from('user-library')
          .upsert(
            { podcast_id: podcastId, user_id: userId },
            { onConflict: 'user_id,podcast_id', ignoreDuplicates: true }
          )
          .select();
          
        console.log('➕ Upsert result:', { error, data });
        if (error) {
          console.error('❌ Upsert error:', error);
          throw error;
        }
      }
    },
    onSuccess: (data, variables) => {
      console.log('✅ useLibraryMutation onSuccess:', { data, variables });
      // Invalidate queries to refetch library status
      queryClient.invalidateQueries({ queryKey: ['libraryStatus'] });
      queryClient.invalidateQueries({ queryKey: ['my-library'] });
      console.log('🔄 Invalidated library queries');
    },
    onError: (error, variables) => {
      console.error('❌ useLibraryMutation onError:', { error, variables });
    },
  });

  return mutation;
};
