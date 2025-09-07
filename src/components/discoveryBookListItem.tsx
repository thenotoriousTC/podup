import { Image, TouchableOpacity, Alert, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '@/providers/playerprovider';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'expo-router';
import { StyledText } from './StyledText';
import { Database } from '@/lib/database.types';

type Podcast = Database['public']['Tables']['podcasts']['Row'];

interface DiscoveryPodcastListItemProps {
  podcast: Podcast;
  isInLibrary: boolean;
  onToggleLibrary: () => void;
  isTogglingLibrary: boolean;
}

export default function DiscoveryPodcastListItem({ podcast, isInLibrary, onToggleLibrary, isTogglingLibrary }: DiscoveryPodcastListItemProps) {
  const { playTrack, podcast: currentPodcast, isPlaying: globalIsPlaying, togglePlayback } = usePlayer();
  const isCurrentTrack = currentPodcast?.id === podcast.id;
  const isPlaying = isCurrentTrack && globalIsPlaying;
  const { user: currentUser } = useAuth();
  const router = useRouter();

  const getImageUrl = (podcast: Podcast) => {
    // Check both possible image columns
    return podcast.image_url || podcast.thumbnail_url || 'https://via.placeholder.com/150x150/0A84FF/FFFFFF?text=Podcast';
  };
  const imageSource = { uri: getImageUrl(podcast) };

  const onPlayPausePress = () => {
    if (!isCurrentTrack) {
      if (!podcast.audio_url) {
        Alert.alert('لا يمكن التشغيل', 'لا يتوفر رابط صوت لهذا المحتوى.');
        return;
      }
      playTrack(podcast);
    } else {
      togglePlayback();
    }
  };

  const onHeartPress = () => {
    console.log('💖 DiscoveryPodcastListItem onHeartPress:', {
      podcastId: podcast.id,
      podcastTitle: podcast.title,
      isInLibrary,
      isTogglingLibrary,
      currentUserId: currentUser?.id,
      onToggleLibraryExists: typeof onToggleLibrary === 'function'
    });
    
    if (isTogglingLibrary) {
      console.log('⏳ Library toggle already in progress, ignoring press');
      return;
    }
    
    if (!currentUser) {
      console.log('❌ No current user, showing alert');
      Alert.alert('الرجاء تسجيل الدخول لحفظ المحتوى.');
      return;
    }
    
    console.log('✅ Calling onToggleLibrary');
    onToggleLibrary();
  };

  const onCardPress = () => {
    router.push({
        pathname: '/podcast/[id]',
        params: {
            id: podcast.id,
            title: podcast.title,
            author: podcast.author,
            image_url: getImageUrl(podcast),
            description: podcast.description || 'لا يوجد وصف متاح.',
            audio_url: podcast.audio_url
        }
    });
};

  return (
      <TouchableOpacity onPress={onCardPress} className="flex-row items-center p-4 bg-white rounded-xl shadow-md m-4">
        {/* Icons on the far left */}
        <View className="flex-row items-center">
          {/* Favorite */}
          <TouchableOpacity
            onPress={onHeartPress}
            activeOpacity={0.7}
            className="p-2"
            disabled={isTogglingLibrary}
          >
            <Ionicons
              name={isInLibrary ? 'heart' : 'heart-outline'}
              size={28}
              color={isInLibrary ? '#FF453A' : '#8E8E93'}
            />
          </TouchableOpacity>

          {/* Play/Pause */}
          <TouchableOpacity
            onPress={onPlayPausePress}
            activeOpacity={0.7}
            className="p-2"
            disabled={!podcast.audio_url}
          >
            <Ionicons
              name={isPlaying ? 'pause-circle' : 'play-circle'}
              size={32}
              color={isPlaying ? '#0A84FF' : '#8E8E93'}
            />
          </TouchableOpacity>
        </View>

        {/* Text content in the middle */}
        <View className="flex-1 ml-4 mr-4">
          <TouchableOpacity onPress={() => podcast.user_id && router.push(`/creator/${podcast.user_id}`)} disabled={!podcast.user_id}><StyledText className="text-sm text-gray-500 text-right">{podcast.author}</StyledText></TouchableOpacity>
          <StyledText fontWeight="SemiBold" className="mt-1 text-lg font-semibold text-black text-right">
            {podcast.title}
          </StyledText>
        </View>

        {/* Image on the right */}
        <Image
          source={imageSource}
          className="w-16 h-16 rounded-lg"
        />

      </TouchableOpacity>
  );
}