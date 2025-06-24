import { View, Text, Pressable, Image, Animated } from "react-native";
import EvilIcons from '@expo/vector-icons/EvilIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { SafeAreaView } from "react-native";
import { router } from "expo-router";
import PlaybackBar from "@/components/PlaybackBar";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useAudioPlayerStatus } from 'expo-audio';
import { usePlayer } from "@/providers/playerprovider";
import { useEffect, useRef } from 'react';

export default function Player() {
  const { player, podcast, seekTo } = usePlayer(); // Use seekTo from context
  const playerStatus = useAudioPlayerStatus(player);
  
  // Animation reference for loading spinner
  const spinValue = useRef(new Animated.Value(0)).current;

  // Create spinning animation
  useEffect(() => {
    let spinAnimation: Animated.CompositeAnimation;
    
    if (playerStatus.isBuffering) {
      // Start continuous spinning animation
      spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000, // 1 second per rotation
          useNativeDriver: true,
        })
      );
      spinAnimation.start();
    } else {
      // Stop animation and reset
      spinValue.stopAnimation();
      spinValue.setValue(0);
    }

    return () => {
      if (spinAnimation) {
        spinAnimation.stop();
      }
    };
  }, [playerStatus.isBuffering, spinValue]);

  // Convert animated value to rotation
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Helper function to get the correct image URL with fallback
  const getImageUrl = (podcast: any) => {
    return podcast.image_url || podcast.thumbnail_url || 'https://via.placeholder.com/150x150/0A84FF/FFFFFF?text=Podcast';
  };

  // Function to skip backward by 10 seconds - now uses debounced seekTo
  const skipBackward = () => {
    if (playerStatus.currentTime !== null) {
      const newTime = Math.max(0, playerStatus.currentTime - 10);
      seekTo(newTime); // Use debounced seekTo
    }
  };

  // Function to skip forward by 10 seconds - now uses debounced seekTo
  const skipForward = () => {
    if (playerStatus.currentTime !== null && playerStatus.duration !== null) {
      const newTime = Math.min(playerStatus.duration, playerStatus.currentTime + 10);
      seekTo(newTime); // Use debounced seekTo
    }
  };

  // Function to toggle repeat mode
  const toggleRepeat = () => {
    if (player) {
      // Use the correct method for expo-audio
      player.loop = !player.loop;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white ">
      {/* Header with subtle blur background */}
      <View className="relative">
        <Pressable
          onPress={() => router.back()}
          className="absolute top-4 left-4 p-3 bg-white/80  rounded-full shadow-md backdrop-blur-sm"
        >
          <EvilIcons name="chevron-down" size={24} color="#1C1C1E" />
        </Pressable>
      </View>

      <View className="flex-1 justify-between px-6 pb-8">
        {/* Album Art Section */}
        <View className="items-center mt-16 mb-8">
          <View className="w-72 h-72 rounded-2xl overflow-hidden mb-8 shadow-xl">
            <Image
              source={{ uri: getImageUrl(podcast) }}
              className="w-full h-full"
              resizeMode="cover"
              defaultSource={{ uri: 'https://via.placeholder.com/150x150/0A84FF/FFFFFF?text=Podcast' }}
            />
          </View>

          {/* Title and Author */}
          <View className="items-center px-4">
            <Text
              className="text-2xl font-bold text-center text-black  mb-2"
              style={{ lineHeight: 32, letterSpacing: -0.5 }}
              numberOfLines={2}
            >
              {podcast.title}
            </Text>
            <Text
              className="text-lg font-medium text-center text-gray-500 "
            >
              {podcast.author}
            </Text>
          </View>
        </View>

        {/* Progress Bar - now uses debounced seekTo */}
        <View className="px-4 mb-8">
          <PlaybackBar
            duration={playerStatus.duration}
            currentTime={playerStatus.currentTime}
            onSeek={seekTo} // Use debounced seekTo instead of direct player.seekTo
          />
        </View>

        {/* Control Buttons */}
        <View className="flex-row justify-center items-center px-8">
          {/* Rewind 10 seconds */}
          <Pressable
            className="p-4 mr-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            onPress={skipBackward}
          >
            <MaterialIcons name="replay-10" size={32} color="black" />
          </Pressable>

          {/* Play/Pause Button */}
          <Pressable
            className="w-20 h-20 bg-white rounded-full items-center justify-center mx-6 shadow-xl"
            style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.95 : 1 }] })}
            onPress={() => {
              playerStatus.playing ? player.pause() : player.play();
            }}
          >
            {playerStatus.isBuffering ? (
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <AntDesign
                  name="loading1"
                  size={32}
                  color="#1C1C1E"
                />
              </Animated.View>
            ) : (
              <AntDesign
                name={playerStatus.playing ? 'pause' : 'play'}
                size={32}
                color="#1C1C1E"
                style={{ marginLeft: playerStatus.playing ? 0 : 2 }}
              />
            )}
          </Pressable>

          {/* Fast Forward 10 seconds */}
          <Pressable
            className="p-4 ml-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            onPress={skipForward}
          >
            <MaterialIcons name="forward-10" size={32} color="black" />
          </Pressable>
        </View>

        {/* Additional Controls Row */}
        <View className="flex-row justify-center items-center px-8 mt-8 space-x-16">
          <Pressable
            className="p-3"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            onPress={toggleRepeat}
          >
            <Ionicons 
              name="repeat" 
              size={40} 
              color={player?.loop ? "#007AFF" : "#8E8E93"} 
            />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}