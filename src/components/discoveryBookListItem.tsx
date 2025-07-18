import { StatusBar } from 'expo-status-bar';
import { Image, TouchableOpacity, Alert, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayerStatus } from 'expo-audio';
import { usePlayer } from '@/providers/playerprovider';
import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'expo-router';

interface Podcast {
  image_url: string | undefined;
  id: string;
  title: string;
  author: string;
  audio_url: string;
  thumbnail_url?: string;
  description?: string;
}

interface DiscoveryPodcastListItemProps {
  podcast: Podcast;
}

export default function DiscoveryPodcastListItem({ podcast }: DiscoveryPodcastListItemProps) {
  const { setPodcast, player, podcast: currentPodcast } = usePlayer();
  const playerStatus = useAudioPlayerStatus(player);
  const isCurrentTrack = currentPodcast?.id === podcast.id;
  const isPlaying = isCurrentTrack && playerStatus.playing;
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: libraryItem, isLoading } = useQuery({
    queryKey: ['library-item', podcast.id, currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;
      const { data, error } = await supabase
        .from('user-library')
        .select('id')
        .eq('podcast_id', podcast.id)
        .eq('user_id', currentUser.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error; // Ignore no rows found
      return data;
    },
    enabled: !!currentUser?.id,
  });

  const isInLibrary = !!libraryItem;

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
      queryClient.invalidateQueries({ queryKey: ['library-item', podcast.id, currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['my-library'] });
      Alert.alert(isInLibrary ? 'Removed from Library' : 'Added to Library');
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
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
      Alert.alert('Please log in to save content.');
      return;
    }
    libraryMutation.mutate();
  };

  const onCardPress = () => {
    router.push({
        pathname: '/podcast/[id]',
        params: {
            id: podcast.id,
            title: podcast.title,
            author: podcast.author,
            image_url: getImageUrl(podcast),
            description: podcast.description || 'No description available.',
            audio_url: podcast.audio_url
        }
    });
};

  return (
      <TouchableOpacity onPress={onCardPress} className="flex-row items-center p-4 bg-white  rounded-xl shadow-md m-4">
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
            disabled={isLoading}
          />
        </TouchableOpacity>

        <StatusBar style="auto" />
      </TouchableOpacity>
  );
}
