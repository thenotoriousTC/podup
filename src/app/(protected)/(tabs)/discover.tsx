import { StatusBar } from 'expo-status-bar';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import books from '@/dummybooks'
import BookListItem from '@/components/bookListItem';


export default function App() {
  return (
     
    <View className=' flex-1 items-center justify-center p-4 pt-12'>
    <FlatList
    data={books}
    contentContainerClassName='gap-4'
    renderItem={({item}) => <BookListItem book={item} />}
    keyExtractor={(item) => item.id}
    className='w-full'
    contentContainerStyle={{gap: 16}}
    />
    </View>
  );
}

