import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, Text, View, Animated, StyleSheet } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useAudioPlayerStatus } from 'expo-audio';
import { usePlayer } from '@/providers/playerprovider';
import { useEffect, useRef } from 'react';

export default function FloatingPlayer() {
  const { player, podcast, setPodcast } = usePlayer();
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

  // Handle when audio finishes playing
  useEffect(() => {
    if (podcast && playerStatus.isLoaded && !playerStatus.playing && playerStatus.currentTime > 0) {
      // Check if we've reached the end of the audio
      const isAtEnd = playerStatus.duration > 0 && 
                     Math.abs(playerStatus.currentTime - playerStatus.duration) < 1;
      
      if (isAtEnd) {
        console.log('Audio finished playing in floating player, ready to replay');
        // Audio has finished, we can now replay from the beginning
      }
    }
  }, [playerStatus.playing, playerStatus.currentTime, playerStatus.duration, podcast, playerStatus.isLoaded]);
  
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  if (!podcast) return null;
  
  const getImageUrl = (podcast: any) => {
    return podcast.image_url || podcast.thumbnail_url || 'https://via.placeholder.com/150x150/0A84FF/FFFFFF?text=Podcast';
  };
  
  const handleRemove = async () => {
    try {
      // Pause the audio player and seek to beginning
      await player.pause();
      await player.seekTo(0);
      // Clear the podcast from state
      setPodcast(null);
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  };

  const handlePlayPause = async () => {
    try {
      if (playerStatus.playing) {
        // Currently playing, pause it
        await player.pause();
      } else {
        // Not playing, check if we need to replay from beginning
        if (playerStatus.duration > 0 && 
            Math.abs(playerStatus.currentTime - playerStatus.duration) < 1) {
          // Audio finished, seek to beginning and play
          await player.seekTo(0);
          await player.play();
        } else {
          // Audio paused in middle, resume playing
          await player.play();
        }
      }
    } catch (error) {
      console.error('Error during play/pause:', error);
    }
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
        onPress={handlePlayPause}
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
      
      <Pressable
        onPress={handleRemove}
        style={styles.removeButton}
      >
        <View style={styles.removeButtonInner}>
          <AntDesign name="close" size={16} color="#666" />
        </View>
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
  removeButton: {
    padding: 5,
    marginLeft: 5,
  },
  removeButtonInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
});