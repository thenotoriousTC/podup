import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PodcastListItem from '../../../components/bookListItem';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { useOfflineCache } from '@/hooks/useOfflineCache';

interface LibraryItem {
  id: string;
  user_id: string;
  podcast: {
    id: string;
    title: string;
    author: string;
    description: string | null;
    image_url: string | null;
    audio_url: string;
    category: string | null;
    user_id: string;
    created_at: string | null;
    updated_at: string | null;
    series_id: string | null;
    duration: number | null;
    local_audio_url: string | null;
    thumbnail_url: string | null;
    view_count: number | null;
  };
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error.message);
      } else {
        setCurrentUser(user);
      }
    };
    fetchUser();
  }, []);

  // Add offline caching for library data - only when user is available
  const cacheKey = currentUser?.id ? `user-library-${currentUser.id}` : null;
  const { cachedData, isStale, saveToCache, isLoading: cacheLoading, debugCache } = useOfflineCache<LibraryItem[]>({
    key: cacheKey || 'user-library-temp', // Fallback key to prevent undefined
    ttl: 300000, // 5 minutes
    fallbackData: []
  });

  // Debug cache on mount
  useEffect(() => {
    if (currentUser?.id) {
      setTimeout(() => debugCache(), 1000); // Delay to let cache load
    }
  }, [currentUser?.id, debugCache]);

  // Always show cached data first, then try to fetch fresh data
  const {data,isLoading,error}=useQuery<LibraryItem[] | null>({
    queryKey :['my-library', currentUser?.id],
    queryFn:async()=> {
      if (!currentUser?.id) return null;
      const { data, error } = await supabase.from('user-library').select('*,podcast:podcasts(*)').eq('user_id',currentUser.id).throwOnError();
      if (error) throw error;
      
      // Save to cache for offline access
      if (data && cacheKey) {
        await saveToCache(data);
        console.log('💾 Library data saved to cache:', data.length, 'items');
      }
      
      return data;
    },
    enabled: !!currentUser?.id,
    // Always use cached data as initial data when available
    initialData: cachedData && cachedData.length > 0 ? cachedData : undefined,
    // Use cached data as placeholder while fetching
    placeholderData: cachedData && cachedData.length > 0 ? cachedData : undefined,
    // Configure for better offline behavior
    networkMode: 'always', // Always try to run, even offline
    refetchOnReconnect: true,
    staleTime: 300000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry network errors when offline, just use cache
      if (error?.message?.includes('fetch')) return false;
      return failureCount < 3;
    },
  })

  // If query fails and we have cached data, use cached data
  const finalData = data || (error && cachedData && cachedData.length > 0 ? cachedData : null);
  
  // Show loading only if we don't have cached data
  if (isLoading && (!cachedData || cachedData.length === 0)) {
    return <ActivityIndicator/>
  }
  
  // Show error only if we don't have cached data
  if (error && (!cachedData || cachedData.length === 0)) {
    return <Text>Error: {error.message}</Text>
  }
  
  return (
    <View className=' flex-1 items-center justify-center p-1  pt-20'>
    <FlatList
    data={finalData}
    contentContainerClassName='gap-4'
    renderItem={({item}) => <PodcastListItem podcast={item.podcast} isInLibrary={true} />}
    keyExtractor={(item) => item.id}
    className='w-full'
    contentContainerStyle={{gap: 16}}
    ListEmptyComponent={
      <View className='flex-1 items-center justify-center p-8 mt-36'>
        <Text className='text-gray-500 text-center text-2xl'>مكتبتك فارغة</Text>
        <Text className='text-indigo-600 text-center mt-2 text-lg'>ابدأ بإضافة بعض البودكاست المفضلة لديك</Text>
      
      </View>
    }
    />
    </View>
  );
}

