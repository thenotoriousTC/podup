import { StatusBar } from 'expo-status-bar';
import { Image, TouchableOpacity, View, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '@/providers/playerprovider';
import { useAudioPlayerStatus } from 'expo-audio';

interface Podcast {
    id: string;
    title: string;
    author: string;
    audio_url: string;
    thumbnail_url?: string;
    image_url?: string;
}

interface PodcastListItemProps {
    podcast: Podcast;
}

export default function PodcastListItem({ podcast }: PodcastListItemProps) {
    const { setPodcast, player, podcast: currentPodcast } = usePlayer();
    const playerStatus = useAudioPlayerStatus(player);
    const isCurrentTrack = currentPodcast?.id === podcast.id;
    const isPlaying = isCurrentTrack && playerStatus.playing;

    const getImageUrl = (podcast: Podcast) => {
        return podcast.image_url || podcast.thumbnail_url || 'https://via.placeholder.com/150x150/0A84FF/FFFFFF?text=Podcast';
    };
    
    const imageSource = { uri: getImageUrl(podcast) };

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

    return (
        <View className="flex-row items-center p-4 bg-white rounded-xl shadow-md">
            <Image
                source={imageSource}
                className="w-16 h-16 rounded-lg"
            />
            <View className="flex-1 ml-4">
                <Text className="text-sm text-gray-500 dark:text-gray-400">{podcast.author}</Text>
                <Text className="mt-1 text-lg font-semibold text-black dark:text-white">
                    {podcast.title}
                </Text>
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

            <StatusBar style="auto" />
        </View>
    );
}
