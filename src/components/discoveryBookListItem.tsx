import { StatusBar } from 'expo-status-bar';
import { Image, TouchableOpacity, Alert, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayerStatus } from 'expo-audio';
import { usePlayer } from '@/providers/playerprovider';
import { supabase } from '@/lib/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';

interface Podcast {
  image_url: string | undefined;
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
  const { setPodcast, player, podcast: currentPodcast } = usePlayer();
  const playerStatus = useAudioPlayerStatus(player);
  const isCurrentTrack = currentPodcast?.id === podcast.id;
  const isPlaying = isCurrentTrack && playerStatus.playing;
  const supabaseClient = supabase;
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [isInLibrary, setIsInLibrary] = useState(false);

  const addToLibrary = useMutation({
    mutationFn: async () =>
      supabaseClient
        .from('user-library')
        .insert({ podcast_id: podcast.id, user_id: currentUser?.id })
        .throwOnError(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-library'] }),
  });
  const getImageUrl = (podcast: Podcast) => {
    // Check both possible image columns
    return podcast.image_url || podcast.thumbnail_url || 'https://via.placeholder.com/150x150/0A84FF/FFFFFF?text=Podcast';
  };
  const imageSource = { uri: getImageUrl(podcast) };

  const onPlayPausePress = () => {
    if (!isCurrentTrack) {
      setPodcast(podcast);
      player.play();
    } else {
      playerStatus.playing ? player.pause() : player.play();
    }
  };

  const onHeartPress = () => {
    if (!currentUser) {
      Alert.alert('يرجى تسجيل الدخول لحفظ المحتوى.');
      return;
    }
    addToLibrary.mutate();
    setIsInLibrary(true);
    Alert.alert('تم الحفظ', `"${podcast.title}" تم الحفظ بنجاح.`);
  };

  return (
    <View className="flex-row items-center p-4 bg-white  rounded-xl shadow-md m-4">
      <Image
        source={imageSource}
        className="w-16 h-16 rounded-lg"
      />
      <View className="flex-1 ml-4">
        <Text className="text-sm text-gray-500 ">{podcast.author}</Text>
        <Text className="mt-1 text-lg font-semibold text-black ">
          {podcast.title}
        </Text>
      </View>

      {/* Play/Pause */}
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

      {/* Favorite */}
      <TouchableOpacity
        onPress={onHeartPress}
        activeOpacity={0.7}
        className="p-2 ml-2"
      >
        <Ionicons
          name={isInLibrary ? 'heart' : 'heart-outline'}
          size={28}
          color={isInLibrary ? '#FF453A' : '#8E8E93'}
        />
      </TouchableOpacity>

      <StatusBar style="auto" />
    </View>
  );
}
