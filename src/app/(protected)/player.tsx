import { Pressable } from '@/components/Pressable';
import { View, Image, Animated as RNAnimated, Alert, AlertButton, SafeAreaView, Dimensions } from 'react-native';;
import EvilIcons from '@expo/vector-icons/EvilIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { router } from "expo-router";
import PlaybackBar from "@/components/PlaybackBar";
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { usePlayer } from "@/providers/playerprovider";
import { useEffect, useRef } from 'react';
import { StyledText } from "@/components/StyledText";
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const PLAYBACK_RATES = [1.0, 1.5, 2.0, 0.75];

const { height: screenHeight } = Dimensions.get('window');

export default function Player() {
  const { podcast, seekTo, playbackRate, setPlaybackRate, sleepTimerRemaining, setSleepTimer, cancelSleepTimer, isPlaying, isLoading, position, duration, togglePlayback } = usePlayer();
  
  // Animation reference for loading spinner
  const spinValue = useRef(new RNAnimated.Value(0)).current;

  // Gesture handling for slide down to close
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const context = useSharedValue({ y: 0 });

  const closePlayer = () => {
    router.back();
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      // Only allow downward movement
      if (event.translationY > 0) {
        translateY.value = context.value.y + event.translationY;
        // Add opacity fade as user drags down
        const progress = Math.min(event.translationY / (screenHeight * 0.5), 1);
        opacity.value = 1 - progress * 0.3;
      }
    })
    .onEnd((event) => {
      const shouldClose = event.translationY > screenHeight * 0.25 || event.velocityY > 500;
      
      if (shouldClose) {
        // Close immediately to prevent white screen flash
        runOnJS(closePlayer)();
      } else {
        // Snap back to original position
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 90,
        });
        opacity.value = withSpring(1, {
          damping: 20,
          stiffness: 90,
        });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  // Create spinning animation
  useEffect(() => {
    let spinAnimation: RNAnimated.CompositeAnimation;
    
    if (isLoading) {
      // Start continuous spinning animation
      spinAnimation = RNAnimated.loop(
        RNAnimated.timing(spinValue, {
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
  }, [isLoading, spinValue]);

  // Handle when audio finishes playing - same logic as floatingPlayer
  useEffect(() => {
    if (podcast && duration > 0 && !isPlaying && position > 0) {
      // Check if we've reached the end of the audio
      const isAtEnd = duration > 0 && 
                     Math.abs(position - duration) < 1;
      
      if (isAtEnd) {
        console.log('Audio finished playing in main player, ready to replay');
        // Audio has finished, we can now replay from the beginning
      }
    }
  }, [isPlaying, position, duration, podcast]);

  // Convert animated value to rotation
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!podcast) {
    // or a loading indicator
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <StyledText>جاري التحميل...</StyledText>
      </SafeAreaView>
    );
  }

  // Helper function to get the correct image URL with fallback
  const getImageUrl = (podcast: any) => {
    return podcast.image_url || podcast.thumbnail_url || 'https://via.placeholder.com/150x150/0A84FF/FFFFFF?text=Podcast';
  };

  // Function to skip backward by 10 seconds - now uses debounced seekTo
  const skipBackward = () => {
    if (position !== null) {
      const newTime = Math.max(0, position - 10);
      seekTo(newTime); // Use debounced seekTo
    }
  };

  // Function to skip forward by 10 seconds - now uses debounced seekTo
  const skipForward = () => {
    if (position !== null && duration !== null) {
      const newTime = Math.min(duration, position + 10);
      seekTo(newTime); // Use debounced seekTo
    }
  };

  const onPlayPause = async () => {
    try {
      await togglePlayback();
    } catch (error) {
      console.error('Error during play/pause:', error);
    }
  };

  const toggleRepeat = async () => {
    // TODO: Implement repeat functionality
    Alert.alert('قريباً', 'ميزة التكرار ستكون متاحة قريباً');
  };

  const changePlaybackRate = () => {
    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % PLAYBACK_RATES.length;
    setPlaybackRate(PLAYBACK_RATES[nextIndex]);
  };

  const showSleepTimerOptions = () => {
    const isTimerActive = sleepTimerRemaining !== null;

    const options: AlertButton[] = [
      // This option is only shown when a timer is active
      { text: 'Stop Timer', onPress: () => cancelSleepTimer(), style: 'destructive' },

      // Standard timer durations
      { text: '15 minutes', onPress: () => setSleepTimer(15) },
      { text: '30 minutes', onPress: () => setSleepTimer(30) },
      { text: '60 minutes', onPress: () => setSleepTimer(60) },

      // The dismiss button's text changes based on whether a timer is active
      { text: isTimerActive ? 'Dismiss' : 'Cancel', style: 'cancel' },
    ];

    // If no timer is active, remove the 'Stop Timer' option
    const alertOptions = isTimerActive ? options : options.slice(1);

    Alert.alert(
      'Sleep Timer',
      'Stop playback after:',
      alertOptions
    );
  };

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        <SafeAreaView className="flex-1 bg-white ">
          {/* Header with subtle blur background */}
          <View className="relative">
            <Pressable
              onPress={() => router.back()}
              className="absolute top-12 right-4 p-3 bg-white/80  rounded-full shadow-md backdrop-blur-sm "
            >
              <EvilIcons name="chevron-down" size={34} color="#FD842B" />
            </Pressable>
          </View>

      <View className="flex-1 justify-between px-6 pb-8">
        {/* Album Art Section */}
        <View className="items-center mt-36 mb-8">
          <View className="w-72 h-72 rounded-2xl overflow-hidden mb-8   bg-white  items-center justify-center mx-6 shadow-2xl shadow-[#FD842B]/50 ">
            <Image
              source={{ uri: getImageUrl(podcast) }}
              className="w-full h-full shadow-3xl bg-white    items-center justify-center mx-6 shadow-[#FD842B]/50 "
              resizeMode="cover"
              defaultSource={{ uri: 'https://via.placeholder.com/150x150/0A84FF/FFFFFF?text=Podcast' }}
            />
          </View>

          {/* Title and Author */}
          <View className="items-center px-4">
            <StyledText
              fontWeight="Bold"
              className="text-2xl font-semibold text-center text-black  mb-2"
              style={{ lineHeight: 32, letterSpacing: -0.5 }}
              numberOfLines={2}
            >
              {podcast.title}
            </StyledText>
            <Pressable onPress={() => podcast.user_id && router.push(`/creator/${podcast.user_id}`)} disabled={!podcast.user_id}>
            <StyledText
              fontWeight="Medium"
              className="text-lg font-medium text-center text-gray-500 "
            >
              {podcast.author}
            </StyledText>
          </Pressable>
          </View>
        </View>

        {/* Sleep Timer Display */}
        {sleepTimerRemaining !== null && (
          <View className="items-center mb-4">
            <StyledText className="text-gray-500">
              Pausing in {Math.floor(sleepTimerRemaining / 60)}:{(sleepTimerRemaining % 60).toString().padStart(2, '0')}
            </StyledText>
          </View>
        )}

        {/* Progress Bar - now uses debounced seekTo */}
        <View className="px-4 mb-8">
          <PlaybackBar
            duration={duration}
            currentTime={position}
            onSeek={seekTo} // Use debounced seekTo instead of direct player.seekTo
          />
        </View>

        {/* Control Buttons */}
        <View className="flex-row-reverse justify-center items-center px-8">
          {/* Rewind 10 seconds */}
          <Pressable
            className="p-4 mr-4 shadow-2xl w-20 h-20 bg-white rounded-full items-center justify-center mx-6  shadow-[#FD842B]/50"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            onPress={skipBackward}
          >
            <MaterialIcons name="replay-10" size={32} color="black" className="shadow-2xl" />
          </Pressable>

          {/* Play/Pause Button */}
          <Pressable
            className="w-20 h-20 bg-white rounded-full items-center justify-center mx-6 shadow-xl shadow-[#FD842B]/50"
            style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.95 : 1 }] })}
            onPress={onPlayPause}
          >
            {isLoading ? (
              <RNAnimated.View style={{ transform: [{ rotate: spin }] }}>
                <AntDesign
                  name="loading1"
                  size={32}
                  color="#1C1C1E"
                />
              </RNAnimated.View>
            ) : (
              <AntDesign
                name={isPlaying ? 'pause' : 'play'}
                size={32}
                color="#1C1C1E"
                style={{ marginLeft: isPlaying ? 0 : 2 }}
              />
            )}
          </Pressable>

          {/* Fast Forward 10 seconds */}
          <Pressable
            className="p-4 ml-4 shadow-2xl w-20 h-20 bg-white rounded-full items-center justify-center mx-6  shadow-[#FD842B]/50"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            onPress={skipForward}
          >
            <MaterialIcons name="forward-10" size={32} color="black" className="shadow-2xl" />
          </Pressable>
        </View>

        {/* Additional Controls Row */}
        <View className="flex-row-reverse justify-around items-center px-8 mt-8">
          <Pressable
            className="p-3 items-center justify-center"
            onPress={toggleRepeat}
          >
            <Ionicons 
              name="repeat" 
              size={30} 
              color="#8E8E93"
            />
          </Pressable>

          <Pressable
            className="p-3 items-center justify-center"
            onPress={changePlaybackRate}
          >
            <StyledText className="text-lg font-bold text-black">{parseFloat(playbackRate.toFixed(1))}x</StyledText>
          </Pressable>

          <Pressable
            className="p-3 items-center justify-center"
            onPress={showSleepTimerOptions}
          >
            <MaterialCommunityIcons 
              name="timer-outline" 
              size={30} 
              color={sleepTimerRemaining ? "#007AFF" : "#8E8E93"} 
            />
          </Pressable>
        </View>
          </View>
        </SafeAreaView>
      </Animated.View>
    </GestureDetector>
  );
}