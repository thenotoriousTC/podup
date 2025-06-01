import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import {AntDesign} from '@expo/vector-icons';
import { Link } from 'expo-router';
import { usePlayer } from '@/providers/playerprovider';

interface Podcast {
    id: string;
    title: string;
    author: string;
    audio_url: string;
    thumbnail_url?: string;
}

interface PodcastListItemProps {
    podcast: Podcast;
}

export default function PodcastListItem({ podcast }: PodcastListItemProps) {
    const { setPodcast, player } = usePlayer();

    const handlePress = async () => {
        try {
            setPodcast(podcast);
            await player.play();
        } catch (error) {
            console.error('Error playing audio:', error);
        }
    };

    return (
        <Pressable
            onPress={handlePress}
            className='flex-row gap-4 items-center p-4 active:opacity-70'
        >
            <Image 
                source={{ uri: podcast.thumbnail_url }}
                className='w-16 aspect-square rounded-md'
            />
            <View className='flex-1'>
                <Text className='text-gray-600'>{podcast.author}</Text>
                <Text className='text-2xl text-red-500'>{podcast.title}</Text>
                <StatusBar style="auto" />
            </View>
            <AntDesign name='playcircleo' size={24} color="#666" />
        </Pressable>
    );
}
