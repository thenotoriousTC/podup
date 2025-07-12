import { StatusBar } from 'expo-status-bar';
import { Image, TouchableOpacity, View, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '@/providers/playerprovider';
import { useAudioPlayerStatus } from 'expo-audio';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';

interface Podcast {
    id: string;
    title: string;
    author: string;
    audio_url: string;
    thumbnail_url?: string;
    image_url?: string;
    description?: string;
}

interface PodcastListItemProps {
    podcast: Podcast;
}

export default function PodcastListItem({ podcast }: PodcastListItemProps) {
    const { setPodcast, player, podcast: currentPodcast } = usePlayer();
    const playerStatus = useAudioPlayerStatus(player);
    const isCurrentTrack = currentPodcast?.id === podcast.id;
    const isPlaying = isCurrentTrack && playerStatus.playing;
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const queryClient = useQueryClient();

    // Query to check if the item is in the user's library
    const { data: libraryItem } = useQuery({
        queryKey: ['library-item', podcast.id, currentUser?.id],
        queryFn: async () => {
            if (!currentUser?.id) return null;
            const { data, error } = await supabase
                .from('user-library')
                .select('id')
                .eq('podcast_id', podcast.id)
                .eq('user_id', currentUser.id)
                .single();
            // Ignore error if no rows are found, which is expected
            if (error && error.code !== 'PGRST116') throw error;
            return data;
        },
        enabled: !!currentUser?.id, // Only run query if user is logged in
    });

    const isInLibrary = !!libraryItem;

    // Mutation to add or remove the item from the library
    const libraryMutation = useMutation({
        mutationFn: async () => {
            if (!currentUser?.id) throw new Error('User not logged in');

            if (isInLibrary) {
                // Remove from library
                const { error } = await supabase
                    .from('user-library')
                    .delete()
                    .eq('id', libraryItem.id);
                if (error) throw error;
            } else {
                // Add to library
                const { error } = await supabase
                    .from('user-library')
                    .insert({ podcast_id: podcast.id, user_id: currentUser.id });
                if (error) throw error;
            }
        },
        onSuccess: () => {
            // Invalidate queries to refetch data and update UI across the app
            queryClient.invalidateQueries({ queryKey: ['library-item', podcast.id, currentUser?.id] });
            queryClient.invalidateQueries({ queryKey: ['my-library'] });
            Alert.alert(isInLibrary ? 'Removed from Library' : 'Added to Library');
        },
        onError: (error) => {
            Alert.alert('Error', error.message);
        },
    });

    const onHeartPress = () => {
        if (!currentUser) {
            Alert.alert('Please log in to save content.');
            return;
        }
        libraryMutation.mutate();
    };

    const onPlayPausePress = async () => {
        try {
            if (!isCurrentTrack) {
                setPodcast(podcast);
                await player.play();
            } else {
                playerStatus.playing ? await player.pause() : await player.play();
            }
        } catch (error) {
            console.error('Error playing audio:', error);
            Alert.alert('Error', 'Could not play the audio');
        }
    };

    const getImageUrl = (podcast: Podcast) => {
        return podcast.image_url || podcast.thumbnail_url || 'https://via.placeholder.com/150x150/0A84FF/FFFFFF?text=Podcast';
    };

    const imageSource = { uri: getImageUrl(podcast) };

    const onCardPress = () => {
        router.push({
            pathname: '/podcast/[id]',
            params: {
                id: podcast.id,
                title: podcast.title,
                author: podcast.author,
                cover: getImageUrl(podcast),
                description: podcast.description || 'No description available.',
                audio_url: podcast.audio_url
            }
        });
    };

    return (
        <TouchableOpacity onPress={onCardPress} activeOpacity={0.8}>
            <View className="flex-row items-center p-4 bg-white rounded-xl shadow-md">
                <Image
                    source={imageSource}
                    className="w-16 h-16 rounded-lg"
                />
                <View className="flex-1 ml-4">
                    <Text className="text-sm text-gray-500 ">{podcast.author}</Text>
                    <Text className="mt-1 text-lg font-semibold text-black ">{podcast.title}</Text>
                </View>

                <TouchableOpacity
                    onPress={onPlayPausePress}
                    activeOpacity={0.7}
                    className="p-2"
                >
                    <Ionicons
                        name={isPlaying ? 'pause-circle' : 'play-circle'}
                        size={32}
                        color={isPlaying ? '#0A84FF' : '#8E8E93'}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={onHeartPress}
                    activeOpacity={0.7}
                    className="p-2 ml-2"
                >
                    <Ionicons
                        name={isInLibrary ? 'heart' : 'heart-outline'}
                        size={28}
                        color={isInLibrary ? '#FF3B30' : '#8E8E93'}
                    />
                </TouchableOpacity>

                <StatusBar style="auto" />
            </View>
        </TouchableOpacity>
    );
}