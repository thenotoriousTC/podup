import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity } from '@/components/TouchableOpacity';
import PodcastListItem from '../../../components/bookListItem';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';

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
  const { user: currentUser } = useAuth();

  const { data, isLoading, error } = useQuery<LibraryItem[] | null>({
    queryKey: ['my-library', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;
      const { data, error } = await supabase
        .from('user-library')
        .select('*,podcast:podcasts(*)')
        .eq('user_id', currentUser.id)
        .throwOnError();
      if (error) throw error;
      return data;
    },
    enabled: !!currentUser?.id,
  });

  if (isLoading) {
    return <ActivityIndicator />;
  }

  if (error) {
    return <Text>Error: {error.message}</Text>;
  }

  return (
    <View className=' flex-1 items-center justify-center p-1  pt-20'>
      <FlatList
        data={data}
        contentContainerClassName='gap-4'
        renderItem={({ item }) => <PodcastListItem podcast={item.podcast} isInLibrary={true} />}
        keyExtractor={(item) => item.id}
        className='w-full'
        contentContainerStyle={{ gap: 16 }}
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

