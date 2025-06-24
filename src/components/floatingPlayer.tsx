import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, Text, View, Animated } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useAudioPlayerStatus } from 'expo-audio';
import { usePlayer } from '@/providers/playerprovider';
import { useEffect, useRef } from 'react';

export default function FloatingPlayer() {
  const { player, podcast } = usePlayer();
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

  if (!podcast) return null;

  // Helper function to get the correct image URL with fallback
  const getImageUrl = (podcast: any) => {
    return podcast.image_url || podcast.thumbnail_url || 'https://via.placeholder.com/150x150/0A84FF/FFFFFF?text=Podcast';
  };

  return (
    <View className=" bottom-0 inset-x-0 bg-white p-4 flex-row items-center \
      rounded-t-2xl shadow-lg border-t border-gray-200 ">
      <Link href="/player" asChild>
        <Pressable className="flex-row items-center flex-1 active:opacity-70">

          {/* Podcast artwork */}
          <Image
            source={{ uri: getImageUrl(podcast) }}
            className="w-14 h-14 rounded-lg"
            defaultSource={{ uri: 'https://via.placeholder.com/150x150/0A84FF/FFFFFF?text=Podcast' }}
          />

          {/* Title & author */}
          <View className="flex-1 ml-4">
            <Text className="text-sm text-gray-500 ">
              {podcast.author}
            </Text>
            <Text className="mt-1 text-base font-semibold text-black " numberOfLines={1}>
              {podcast.title}
            </Text>
          </View>

          {/* Status bar alignment */}
          <StatusBar style="auto" />
        </Pressable>
      </Link>

      {/* Play/Pause control */}
      <Pressable
        onPress={() => {
          playerStatus.playing ? player.pause() : player.play();
        }}
        className="ml-2 p-2 active:opacity-70"
      >
        {playerStatus.isBuffering ? (
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <AntDesign
              name="loading1"
              size={28}
              color="#0A84FF"
            />
          </Animated.View>
        ) : (
          <AntDesign
            name={playerStatus.playing ? 'pausecircle' : 'playcircleo'}
            size={28}
            color={playerStatus.playing ? '#0A84FF' : '#8E8E93'}
          />
        )}
      </Pressable>
    </View>
  );
}