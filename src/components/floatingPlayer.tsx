import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import {AntDesign} from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useAudioPlayerStatus } from 'expo-audio';
import { usePlayer } from '@/providers/playerprovider';
/*
type Book ={
    id:string;
    title : string;
    author : string;
    audio_url : string;
    thumbnail_url ?: string;
}
type BookListItem ={
book :Book
}
*/
export default function FloatingPlayer () {
    
   // const player = useAudioPlayer({ uri: book.audio_url });
   const {player,podcast}=usePlayer()
   const playerStatus= useAudioPlayerStatus(player);
  if ( !podcast) return null;
  return (
    <View className=' left-1 right-1 bg-white p-2 shadow-2xl shadow-black rounded-t-lg'>
    <Link  href='/player' asChild>
      <Pressable className='flex-row gap-4 items-center '>
        <Image source={{uri:podcast.thumbnail_url}}
         className='w-16 aspect-square rounded-md'
          />
        <View className='flex-1'>
          <Text >{podcast.author}</Text>
      <Text className='text-2xl text-red-500'>{podcast.title}</Text>
      
      <StatusBar style="auto" />
    </View>
        
        
        <AntDesign name={playerStatus.isBuffering?"loading2":playerStatus.playing?"pause":"playcircleo"} size={24} onPress={() => {
          playerStatus.playing ? player.pause() : player.play();
           
        }
        }
    
    />
    </Pressable></Link></View>)
}
