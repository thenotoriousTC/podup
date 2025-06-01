import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from 'react-native';
import PodcastListItem from '../../../components/bookListItem';
import { useUser } from '@clerk/clerk-expo';
import { useSupabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';


export default function App() {
  const {user}=useUser();
  const supabase=useSupabase();
  const {data,isLoading,error}=useQuery({
    queryKey :['my-library'],
    queryFn:async()=> {
      const { data, error } = await supabase.from('user-library').select('*,podcast:podcasts(*)').eq('user_id',user?.id).throwOnError();
      if (error) throw error;
      return data;
    }
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

