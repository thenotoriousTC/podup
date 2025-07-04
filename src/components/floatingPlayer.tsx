import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, Text, View, Animated, StyleSheet } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useAudioPlayerStatus } from 'expo-audio';
import { usePlayer } from '@/providers/playerprovider';
import { useEffect, useRef } from 'react';

export default function FloatingPlayer() {
  const { player, podcast } = usePlayer();
  const playerStatus = useAudioPlayerStatus(player);

  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let spinAnimation: Animated.CompositeAnimation;

    if (playerStatus.isBuffering) {
      spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();
    } else {
      spinValue.stopAnimation();
      spinValue.setValue(0);
    }

    return () => {
      if (spinAnimation) {
        spinAnimation.stop();
      }
    };
  }, [playerStatus.isBuffering, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!podcast) return null;

  const getImageUrl = (podcast: any) => {
    return podcast.image_url || podcast.thumbnail_url || 'https://via.placeholder.com/150x150/0A84FF/FFFFFF?text=Podcast';
  };

  return (
    <View style={styles.container} className=' shadow-2xl rounded-full shadow-gray-400 '>
      <Link href="/player" asChild>
        <Pressable style={styles.pressableContainer}>
          <Image
            source={{ uri: getImageUrl(podcast) }}
            style={styles.image}
            defaultSource={{ uri: 'https://via.placeholder.com/150x150/0A84FF/FFFFFF?text=Podcast' }}
          />
          <View style={styles.textContainer}>
            <Text style={styles.authorText}>{podcast.author}</Text>
            <Text style={styles.titleText} numberOfLines={1}>{podcast.title}</Text>
          </View>
          <StatusBar style="auto" />
        </Pressable>
      </Link>
      <Pressable
        onPress={() => (playerStatus.playing ? player.pause() : player.play())}
        style={styles.playPauseButton}
      >
        {playerStatus.isBuffering ? (
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <AntDesign name="loading1" size={28} color="#0A84FF" />
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

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    marginHorizontal: 2,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 0.04,
    borderColor: '#000000',
    
   
  },
  pressableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  image: {
    padding: 5,
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
  },
  authorText: {
    fontSize: 14,
    color: 'gray',
  },
  titleText: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  playPauseButton: {
    padding: 5,
  },
});