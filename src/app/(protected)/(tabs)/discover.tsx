import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { useSupabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import DiscoveryPodcastListItem from '@/components/discoveryBookListItem';

export default function App() {
const supabase=useSupabase();
  const {data,isLoading,error} = useQuery({
    queryKey:['podcasts'],
    queryFn:async()=>supabase.from('podcasts').select('*').throwOnError(),
    
  });
 // console.log(JSON.stringify(data?.data,null,2));

/*

  const fetchPodcasts = async () => {
    const {data,error}=await supabase.from('podcasts').select('*');
    console.log(data);
    console.error(  error);
  }
  useEffect(() => {
    
      fetchPodcasts();
  }
  , []);

*/
if(isLoading){ 
  return <View className=' flex-1 items-center justify-center p-4 pt-12'>
  <ActivityIndicator size='large' color='#0000ff' />
</View>

}
 if(error) {return <View className=' flex-1 items-center justify-center p-4 pt-12'>
<Text>Error fetching podcasts</Text>

 </View>
 }
  return (
     
    <View className=' flex-1 items-center justify-center p-2 '>
    <FlatList
    data={data?.data||[]}
    contentContainerClassName='gap-4'
    renderItem={({item}) => <DiscoveryPodcastListItem podcast={item} />}
    keyExtractor={(item) => item.id}
    className='w-full'
    contentContainerStyle={{gap: 16}}
    />
    </View>
  );
}

