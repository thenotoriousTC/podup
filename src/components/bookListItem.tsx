import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import {AntDesign} from '@expo/vector-icons';
import { Link } from 'expo-router';

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

export default function BookListItem ({book}:BookListItem) {
  return (
    <Link  href='/player' asChild>
    <Pressable className='flex-row gap-4 items-center'>
      <Image source={{uri:book.thumbnail_url}}
      className='w-16 aspect-square rounded-md'
      />
      <View className='flex-1'>
        <Text >{book.author}</Text>
      <Text className='text-2xl text-red-500'>{book.title}</Text>
     
      <StatusBar style="auto" />
    </View>
     <AntDesign name='playcircleo' size={24}/>
    </Pressable></Link>)
}
