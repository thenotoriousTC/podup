import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '@/providers/playerprovider';
import { useAudioPlayerStatus } from 'expo-audio';

const PodcastDetail = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { player, podcast: currentPodcast, setPodcast, incrementViewCount, getViewCount } = usePlayer();
  const playerStatus = useAudioPlayerStatus(player);
  const [viewCount, setViewCount] = useState(0);
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
  const isPlaying = isCurrentTrack && playerStatus.playing;
  const isLoaded = playerStatus.isLoaded;

  // Load view count on component mount
  useEffect(() => {
    const loadViewCount = async () => {
      const count = await getViewCount(podcastData.id);
      setViewCount(count);
    };
    
    if (podcastData.id) {
      loadViewCount();
    }
  }, [podcastData.id]);

  // Track when playback starts to increment view count
  useEffect(() => {
    if (isCurrentTrack && isLoaded && playerStatus.playing && !hasIncrementedView.current) {
      // Only increment once per session when playback actually starts
      if (playerStatus.currentTime > 0 || playerStatus.duration > 0) {
        incrementViewCount(podcastData.id);
        setViewCount(prev => prev + 1);
        hasIncrementedView.current = true;
        console.log(`View count incremented for podcast: ${podcastData.id}`);
      }
    }
  }, [isCurrentTrack, isLoaded, playerStatus.playing, playerStatus.currentTime, playerStatus.duration, podcastData.id]);

  // Reset increment flag when switching to different podcast
  useEffect(() => {
    if (!isCurrentTrack) {
      hasIncrementedView.current = false;
    }
  }, [isCurrentTrack]);

  // Handle when audio finishes playing
  useEffect(() => {
    if (isCurrentTrack && isLoaded && !playerStatus.playing && playerStatus.currentTime > 0) {
      // Check if we've reached the end of the audio
      const isAtEnd = playerStatus.duration > 0 && 
                     Math.abs(playerStatus.currentTime - playerStatus.duration) < 1;
      
      if (isAtEnd) {
        console.log('Audio finished playing, ready to replay');
        // Reset the increment flag so if they replay, it could count again
        hasIncrementedView.current = false;
      }
    }
  }, [playerStatus.playing, playerStatus.currentTime, playerStatus.duration, isCurrentTrack, isLoaded]);

  const onPlayPausePress = async () => {
    try {
      if (!isCurrentTrack) {
        // Load new podcast - reset increment flag for new track
        hasIncrementedView.current = false;
        setPodcast(podcastData);
        await player.play();
      } else {
        if (playerStatus.playing) {
          // Currently playing, pause it
          await player.pause();
        } else {
          // Not playing, check if we need to replay from beginning
          if (playerStatus.duration > 0 && 
              Math.abs(playerStatus.currentTime - playerStatus.duration) < 1) {
            // Audio finished, seek to beginning and play
            hasIncrementedView.current = false; // Allow incrementing again on replay
            await player.seekTo(0);
            await player.play();
          } else {
            // Audio paused in middle, resume playing
            await player.play();
          }
        }
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

  return (
    <>
      <ScrollView className="flex-1 bg-gray-50">
        <View className="relative bg-gradient-to-b from-violet-600 to-purple-700 pt-12 pb-8">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="absolute top-14 left-4 z-20 bg-white/20 backdrop-blur-sm rounded-full p-3"
          >
            <Ionicons name="arrow-back" size={24} color="#9333EA" />
          </TouchableOpacity>
          
          <View className="items-center px-6 mt-12">
            <View 
              className="rounded-2xl overflow-hidden"
              style={{ 
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8
              }}
            >
              <Image
                source={{ uri: podcastData.image_url }}
                className="w-48 h-48"
                style={{ borderRadius: 16 }}
              />
            </View>
            
            <Text className="text-3xl font-bold mt-6 text-center px-4 text-black">
              {podcastData.title}
            </Text>
            <Text className="text-xl text-purple-500 mt-2 font-medium">
              {podcastData.author}
            </Text>
            
            <View className="flex-row items-center justify-center mt-4 space-x-6">
              <View className="items-center">
                <Ionicons name="star" size={20} color="#FCD34D" />
                <Text className="text-yellow-500 text-sm mt-1">Featured</Text>
              </View>
              <View className="items-center pl-6">
                <Ionicons name="eye" size={20} color="#8B5CF6" />
                <Text className="text-purple-500 text-sm mt-1">
                  {formatViewCount(viewCount)} plays
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="px-6 -mt-4">
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
              <Text className="text-white font-bold text-lg ml-3">Listen</Text>
            </View>
          </TouchableOpacity>

          {podcastData.description && (
            <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-3">About This Podcast</Text>
              <Text className="text-gray-700 leading-6 text-base">
                {podcastData.description}
              </Text>
            </View>
          )}

          {podcastData.author && (
            <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <View className="flex-row items-center mb-2">
                <Ionicons name="person-outline" size={20} color="#8B5CF6" />
                <Text className="text-gray-900 font-semibold ml-2">Host</Text>
              </View>
              <Text className="text-gray-600 text-base">{podcastData.author}</Text>
            </View>
          )}

          {/* Stats Section */}
          <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">Stats</Text>
            <View className="flex-row items-center">
              <Ionicons name="play-circle" size={20} color="#8B5CF6" />
              <Text className="text-gray-700 ml-2">
                {formatViewCount(viewCount)} total plays
              </Text>
            </View>
          </View>
          
        </View>
      </ScrollView>
    </>
  );
};

export default PodcastDetail;