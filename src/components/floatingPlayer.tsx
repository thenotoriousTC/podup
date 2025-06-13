import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, Text, View } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useAudioPlayerStatus } from 'expo-audio';
import { usePlayer } from '@/providers/playerprovider';

export default function FloatingPlayer() {
  const { player, podcast } = usePlayer();
  const playerStatus = useAudioPlayerStatus(player);

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
        <AntDesign
          name={
            playerStatus.isBuffering
              ? 'loading2'
              : playerStatus.playing
              ? 'pausecircle'
              : 'playcircleo'
          }
          size={28}
          color={playerStatus.playing ? '#0A84FF' : '#8E8E93'}
        />
      </Pressable>
    </View>
  );
}