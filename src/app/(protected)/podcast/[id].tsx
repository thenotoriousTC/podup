import { View, Image, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '@/providers/playerprovider';
import { supabase } from '@/lib/supabase';
import { StyledText } from '@/components/StyledText';

const PodcastDetail = () => {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const params = useLocalSearchParams();
  const { playTrack, podcast: currentPodcast, isPlaying: globalIsPlaying, position, duration, incrementViewCount } = usePlayer();
  const [viewCount, setViewCount] = useState(0);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const hasIncrementedView = useRef(false);

  const podcastData = {
    id: params.id?.toString() || '',
    title: params.title?.toString() || '',
    author: params.author?.toString() || '',
    description: params.description?.toString() || '',
    image_url: params.image_url?.toString() || '',
    audio_url: params.audio_url?.toString() || '',
  };

  const isCurrentTrack = currentPodcast?.id === podcastData.id;
  const isPlaying = isCurrentTrack && globalIsPlaying;
  const isLoaded = duration > 0;

  // On mount, fetch additional podcast data like view count
  useEffect(() => {
    const fetchPodcastDetails = async () => {
      if (!podcastData.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from('podcasts')
        .select('view_count, user_id')
        .eq('id', podcastData.id)
        .single();

      if (error) {
        console.error('Error fetching podcast details:', error);
      } else if (data) {
        setViewCount(data.view_count || 0);
        setCreatorId(data.user_id || null);
      }
      
      setIsLoading(false);
    };

    fetchPodcastDetails();
  }, [podcastData.id]);

  // Track when playback starts to increment view count
  useEffect(() => {
    if (isCurrentTrack && isLoaded && isPlaying && !hasIncrementedView.current) {
      // Only increment once per session when playback actually starts
      if (position > 0 || duration > 0) {
        incrementViewCount(podcastData.id);
        setViewCount(prev => prev + 1);
        hasIncrementedView.current = true;
        console.log(`View count incremented for podcast: ${podcastData.id}`);
      }
    }
  }, [isCurrentTrack, isLoaded, isPlaying, position, duration, podcastData.id]);

  // Reset increment flag when switching to different podcast
  useEffect(() => {
    if (!isCurrentTrack) {
      hasIncrementedView.current = false;
    }
  }, [isCurrentTrack]);

  // Handle when audio finishes playing
  useEffect(() => {
    if (isCurrentTrack && isLoaded && !isPlaying && position > 0) {
      // Check if we've reached the end of the audio
      const isAtEnd = duration > 0 && 
                     Math.abs(position - duration) < 1;
      
      if (isAtEnd) {
        console.log('Audio finished playing, ready to replay');
        // Reset the increment flag so if they replay, it could count again
        hasIncrementedView.current = false;
      }
    }
  }, [isPlaying, position, duration, isCurrentTrack, isLoaded]);

  const onPlayPausePress = async () => {
    try {
      if (!isCurrentTrack) {
        // Load new podcast - reset increment flag for new track
        hasIncrementedView.current = false;
        playTrack(podcastData);
      } else {
        // For current track, just toggle playback
        // The Track Player context will handle play/pause logic
      }
      // Navigate to player page after starting/resuming audio
      router.push('/player');
    } catch (error) {
      console.error('Error during play/pause:', error);
    }
  };

  const formatViewCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        className="bg-gray-50"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="relative">
          {/* Header background */}
          <View className="bg-violet-200 h-64 w-full" />

          {/* Content */}
          <View className="-mt-48 items-center">
            <View className="rounded-2xl shadow-xl bg-white p-2">
              <Image
                source={{ uri: podcastData.image_url || 'https://via.placeholder.com/150' }}
                className="w-48 h-48"
                style={{ borderRadius: 16 }}
              />
            </View>
            
            <StyledText fontWeight="Bold" className="text-3xl font-semibold mt-6 text-center px-4 text-black">
              {podcastData.title}
            </StyledText>
            <TouchableOpacity onPress={() => {if (typeof creatorId === 'string' && creatorId) {router.push(`/creator/${creatorId}`);}}} disabled={!creatorId}>
              <StyledText fontWeight="SemiBold" className="text-xl text-purple-500 mt-2 font-medium">
                {podcastData.author}
              </StyledText>
            </TouchableOpacity>
            
            <View className="flex-row items-center justify-center mt-4 space-x-6">
              <View className="items-center">
                <Ionicons name="star" size={20} color="#FCD34D" />
                <StyledText className="text-yellow-500 text-sm mt-1">مميز</StyledText>
              </View>
              <View className="items-center pl-6">
                <Ionicons name="eye" size={20} color="#8B5CF6" />
                <StyledText className="text-purple-500 text-sm mt-1">
                  {formatViewCount(viewCount)} مشاهدة
                </StyledText>
              </View>
            </View>
          </View>
        </View>

        <View className="px-6 mt-4 ">
          <TouchableOpacity
            onPress={onPlayPausePress}
            className="bg-violet-600 py-4 px-8 rounded-2xl shadow-lg mb-6"
            style={{ 
              shadowColor: '#8B5CF6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6
            }}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={28} color="white" className="mr-3" />
              <StyledText fontWeight="Bold" className="text-white font-semibold text-lg ml-3">إستمع</StyledText>
            </View>
          </TouchableOpacity>

          {podcastData.description && (
            <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <StyledText fontWeight="Bold" className="text-lg font-semibold text-gray-900 mb-3 text-right">معلومات حول البودكاست</StyledText>
              <StyledText className="text-gray-700 leading-6 text-base text-right">
                {podcastData.description}
              </StyledText>
            </View>
          )}

          {podcastData.author && (
            <TouchableOpacity onPress={() => {if (typeof creatorId === 'string' && creatorId) {router.push(`/creator/${creatorId}`);}}} disabled={!creatorId}>
              <View className="bg-white rounded-2xl p-6 shadow-sm mb-6 text">
                <View className="flex-row items-center mb-2 text-right">
                  <Ionicons name="person-outline" size={20} color="#8B5CF6" />
                  <StyledText fontWeight="SemiBold" className="text-gray-900 font-semibold ml-2 text-right">المستضيف</StyledText>
                </View>
                <StyledText className="text-gray-600 text-base text-right">{podcastData.author}</StyledText>
              </View>
            </TouchableOpacity>
          )}

          {/* Stats Section */}
          <View className="bg-white rounded-2xl p-6 shadow-sm mb-6 text-right">
            <StyledText fontWeight="Bold" className="text-lg font-semibold text-gray-900 mb-3 text-right">إحصائيات</StyledText>
            <View className="flex-row items-center text-right">
              <Ionicons name="play-circle" size={20} color="#8B5CF6" />
              <StyledText className="text-gray-700 ml-2 text-right">
                {formatViewCount(viewCount)} إجمالي المشاهدات
              </StyledText>
            </View>
          </View>
          
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PodcastDetail;