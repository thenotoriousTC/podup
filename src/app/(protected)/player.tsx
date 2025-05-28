import { View, Text, Pressable, Image } from "react-native";
import EvilIcons from '@expo/vector-icons/EvilIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import dummybooks from "@/dummybooks";
import { SafeAreaView } from "react-native";
import { router } from "expo-router";
import PlaybackBar from "@/components/PlaybackBar";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

export default function Player() {
  const book = dummybooks[1];
  const player = useAudioPlayer({ uri: book.audio_url });
  const playerStatus = useAudioPlayerStatus(player);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header with subtle blur background */}
      <View className="relative">
        <Pressable 
          onPress={() => router.back()} 
          className="absolute top-4 left-4 p-3 z-10 bg-white/80 rounded-full shadow-sm"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 }}
        >
          <EvilIcons name="chevron-down" size={24} color="#1C1C1E" />
        </Pressable>
      </View>

      <View className="flex-1 justify-between px-6 pb-8">
        {/* Album Art Section */}
        <View className="items-center mt-16 mb-8">
          <View 
            className="w-72 h-72 rounded-2xl overflow-hidden mb-8"
            style={{ 
              shadowColor: '#000', 
              shadowOffset: { width: 0, height: 8 }, 
              shadowOpacity: 0.2, 
              shadowRadius: 24 
            }}
          >
            <Image 
              source={{ uri: book.thumbnail_url }} 
              className="w-full h-full" 
              resizeMode="cover"
            />
          </View>
          
          {/* Title and Author */}
          <View className="items-center px-4">
            <Text 
              className="text-2xl font-bold text-center mb-2 text-gray-900" 
              style={{ 
                fontFamily: 'SF Pro Display',
                lineHeight: 32,
                letterSpacing: -0.5
              }}
              numberOfLines={2}
            >
              {book.title}
            </Text>
            <Text 
              className="text-lg text-gray-500 text-center"
              style={{ 
                fontFamily: 'SF Pro Text',
                fontWeight: '500'
              }}
            >
              {book.author}
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
          <Pressable 
            className="p-4 mr-6"
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              transform: [{ scale: pressed ? 0.95 : 1 }]
            })}
          >
            <AntDesign name="stepbackward" size={28} color="#1C1C1E" />
          </Pressable>

          {/* Rewind */}
          <Pressable 
            className="p-4 mr-4"
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              transform: [{ scale: pressed ? 0.95 : 1 }]
            })}
          >
            <Ionicons name="play-back" size={32} color="#1C1C1E" />
          </Pressable>
          
          {/* Play/Pause Button */}
          <Pressable 
            className="w-20 h-20 bg-white rounded-full items-center justify-center mx-6"
            style={({ pressed }) => ({
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              transform: [{ scale: pressed ? 0.95 : 1 }]
            })}
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

          {/* Fast Forward */}
          <Pressable 
            className="p-4 ml-4"
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              transform: [{ scale: pressed ? 0.95 : 1 }]
            })}
          >
            <Ionicons name="play-forward" size={32} color="#1C1C1E" />
          </Pressable>

          {/* Skip Forward */}
          <Pressable 
            className="p-4 ml-6"
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              transform: [{ scale: pressed ? 0.95 : 1 }]
            })}
          >
            <AntDesign name="stepforward" size={28} color="#1C1C1E" />
          </Pressable>
        </View>

        {/* Additional Controls Row */}
        <View className="flex-row justify-between items-center px-8 mt-8">
          <Pressable 
            className="p-3"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Ionicons name="shuffle" size={24} color="#8E8E93" />
          </Pressable>

          <Pressable 
            className="p-3"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Ionicons name="repeat" size={24} color="#8E8E93" />
          </Pressable>

          <Pressable 
            className="p-3"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Ionicons name="list" size={24} color="#8E8E93" />
          </Pressable>

          <Pressable 
            className="p-3"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Ionicons name="volume-medium" size={24} color="#8E8E93" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}