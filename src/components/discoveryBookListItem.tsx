import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, StyleSheet, Text, View, Alert } from 'react-native';
import {AntDesign} from '@expo/vector-icons';
import { Link } from 'expo-router';
import { usePlayer } from '@/providers/playerprovider';
import { supabase } from '@/lib/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';

interface Podcast {
    id: string;
    title: string;
    author: string;
    audio_url: string;
    thumbnail_url?: string;
}

interface DiscoveryPodcastListItemProps {
    podcast: Podcast;
}

export default function DiscoveryPodcastListItem({ podcast }: DiscoveryPodcastListItemProps) {
    const { setPodcast, player } = usePlayer();
    const supabaseClient = supabase; // Use the imported supabase client directly
    const queryClient = useQueryClient();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isInLibrary, setIsInLibrary] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user }, error } = await supabaseClient.auth.getUser();
            if (error) {
                console.error('Error fetching user:', error.message);
            } else {
                setCurrentUser(user);
            }
        };
        fetchUser();
    }, [supabaseClient]);
    const {mutate}=useMutation({
        mutationFn:async()=>supabaseClient.from('user-library').insert({
            podcast_id:podcast.id,
            user_id:currentUser?.id,

        }).throwOnError(),
        onSuccess:()=>{
            queryClient.invalidateQueries({queryKey:['my-library']})
        }
    })

    
    const handlePress = async () => {
        try {
            setPodcast(podcast);
            await player.play();
        } catch (error) {
            console.error('Error playing audio:', error);
        }
    };

    return (
        <View className='flex-row gap-4 items-center p-4 active:opacity-70  ' >
            <Image 
                source={{ uri: podcast.thumbnail_url }}
                className='w-16 aspect-square rounded-md'
            />
            <View className='flex-1'>
                <Text className='text-gray-600'>{podcast.author}</Text>
                <Text className='text-2xl text-red-500'>{podcast.title}</Text>
                <StatusBar style="auto" />
            </View>
           <Pressable
            onPress={handlePress}
            className='active:opacity-70'
        > <AntDesign name='playcircleo' size={24} color="#666" />
        </Pressable>
     
            <AntDesign 
            onPress={()=>{
                mutate();
                setIsInLibrary(true);
                Alert.alert('Success', 'Added to library');
            }}
            name={isInLibrary ? "heart" : "hearto"} 
            size={24} 
            color={isInLibrary ? "#ff0000" : "#666"} />
        </View>
    );
}
