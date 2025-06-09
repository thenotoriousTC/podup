import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from 'react-native';
import PodcastListItem from '../../../components/bookListItem';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';


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
  const {data,isLoading,error}=useQuery({
    queryKey :['my-library', currentUser?.id],
    queryFn:async()=> {
      if (!currentUser?.id) return null; // Or throw an error, or return empty array
      const { data, error } = await supabase.from('user-library').select('*,podcast:podcasts(*)').eq('user_id',currentUser.id).throwOnError();
      if (error) throw error;
      return data;
    },
    enabled: !!currentUser?.id // Only run the query if currentUser.id exists
  })
  if (isLoading) return <ActivityIndicator/>
  if (error) return <Text>Error: {error.message}</Text>
  return (
     


    <View className=' flex-1 items-center justify-center p-1'>
    <FlatList
    data={data}
    contentContainerClassName='gap-4'
    renderItem={({item}) => <PodcastListItem podcast={item.podcast} />}
    keyExtractor={(item) => item.id}
    className='w-full'
    contentContainerStyle={{gap: 16}}
    />
    </View>
  );
}

