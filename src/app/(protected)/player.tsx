import { View, Text, Pressable, Image } from "react-native";
import EvilIcons from '@expo/vector-icons/EvilIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { SafeAreaView } from "react-native";
import { router } from "expo-router";
import PlaybackBar from "@/components/PlaybackBar";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useAudioPlayerStatus } from 'expo-audio';
import { usePlayer } from "@/providers/playerprovider";

export default function Player() {
  const { player, podcast } = usePlayer();
  const playerStatus = useAudioPlayerStatus(player);

  // Helper function to get the correct image URL with fallback
  const getImageUrl = (podcast: any) => {
    return podcast.image_url || podcast.thumbnail_url || 'https://via.placeholder.com/150x150/0A84FF/FFFFFF?text=Podcast';
  };

  // Function to skip backward by 10 seconds
  const skipBackward = () => {
    if (player && playerStatus.currentTime !== null) {
      const newTime = Math.max(0, playerStatus.currentTime - 10);
      player.seekTo(newTime);
    }
  };

  // Function to skip forward by 10 seconds
  const skipForward = () => {
    if (player && playerStatus.currentTime !== null && playerStatus.duration !== null) {
      const newTime = Math.min(playerStatus.duration, playerStatus.currentTime + 10);
      player.seekTo(newTime);
    }
  };

  // Function to toggle repeat mode
  const toggleRepeat = () => {
    if (player) {
      // Use the correct method for expo-audio
      player.loop = !player.loop;
    }
  };

  // Function to toggle mute
  const toggleMute = () => {
    if (player) {
      // Toggle between volume 0 (muted) and 1 (full volume)
      player.volume = player.volume > 0 ? 0 : 1;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#1c1c1e]">
      {/* Header with subtle blur background */}
      <View className="relative">
        <Pressable
          onPress={() => router.back()}
          className="absolute top-4 left-4 p-3 bg-white/80 dark:bg-[#1c1c1e]/80 rounded-full shadow-md backdrop-blur-sm"
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
              className="text-2xl font-bold text-center text-black dark:text-white mb-2"
              style={{ lineHeight: 32, letterSpacing: -0.5 }}
              numberOfLines={2}
            >
              {podcast.title}
            </Text>
            <Text
              className="text-lg font-medium text-center text-gray-500 dark:text-gray-400"
            >
              {podcast.author}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View className="px-4 mb-8">
          <PlaybackBar
            duration={playerStatus.duration}
            currentTime={playerStatus.currentTime}
            onSeek={(seconds) => player.seekTo(seconds)}
          />
        </View>

        {/* Control Buttons */}
        <View className="flex-row justify-center items-center px-8">
          {/* Skip Backward */}
        
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
            <AntDesign
              name={playerStatus.playing ? 'pause' : 'play'}
              size={32}
              color="#1C1C1E"
              style={{ marginLeft: playerStatus.playing ? 0 : 2 }}
            />
          </Pressable>

          {/* Fast Forward 10 seconds */}
          <Pressable
            className="p-4 ml-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            onPress={skipForward}
          >
            <MaterialIcons name="forward-10" size={32} color="black" />
          </Pressable>

          {/* Skip Forward */}
          
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