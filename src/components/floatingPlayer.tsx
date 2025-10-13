import { Pressable } from '@/components/Pressable';
import { Image, View, Animated, StyleSheet } from 'react-native';;
import { AntDesign } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { usePlayer } from '@/providers/playerprovider';
import { useEffect, useRef } from 'react';
import { StyledText } from './StyledText';
import TrackPlayer from 'react-native-track-player';

export default function FloatingPlayer() {
  const { podcast, setPodcast, isPlaying, isLoading, position, duration, togglePlayback } = usePlayer();
  
  const spinValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    let spinAnimation: Animated.CompositeAnimation;
    
    if (isLoading) {
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
  }, [isLoading, spinValue]);

  // Handle when audio finishes playing
  useEffect(() => {
    if (podcast && duration > 0 && !isPlaying && position > 0) {
      // Check if we've reached the end of the audio
      const isAtEnd = Math.abs(position - duration) < 1;
      
      if (isAtEnd) {
        console.log('Audio finished playing in floating player, ready to replay');
        // Audio has finished, we can now replay from the beginning
      }
    }
  }, [isPlaying, position, duration, podcast]);
  
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
      // Stop the audio player
      await TrackPlayer.stop();
      // Clear the podcast from state
      setPodcast(null);
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  };

  const handlePlayPause = async () => {
    try {
      await togglePlayback();
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
          />
          <View style={styles.textContainer}>
            <StyledText style={styles.authorText}>{podcast.author}</StyledText>
            <StyledText style={styles.titleText} numberOfLines={1}>{podcast.title}</StyledText>
          </View>
        </Pressable>
      </Link>
      
      <Pressable
        onPress={handlePlayPause}
        style={styles.playPauseButton}
      >
        {isLoading ? (
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <AntDesign name="loading1" size={28} color="#0A84FF" />
          </Animated.View>
        ) : (
          <AntDesign
            name={isPlaying ? 'pausecircle' : 'playcircleo'}
            size={28}
            color={isPlaying ? '#0A84FF' : '#8E8E93'}
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
    margin: 10,
  },
  authorText: {
    fontSize: 14,
    color: 'gray',
  },
  titleText: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: 'semibold',
    color: 'black',
  },
  playPauseButton: {
    padding: 5,
  },
  removeButton: {
    padding: 5,
    margin: 5,
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