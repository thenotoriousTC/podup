import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  RepeatMode,
  Event,
  State,
} from 'react-native-track-player';

/**
 * Setup TrackPlayer with proper configuration for background playback and notification controls
 * Based on official React Native Track Player documentation
 */
export async function setupTrackPlayer(): Promise<boolean> {
  let isSetup = false;
  try {
    // Check if the player is already set up
    const currentTrack = await TrackPlayer.getActiveTrack();
    isSetup = true;
  } catch {
    // Player is not set up, proceed with setup
    await TrackPlayer.setupPlayer({
      // Configure for background playback
      autoHandleInterruptions: true,
    });
    
    // Configure capabilities for notification controls
    await TrackPlayer.updateOptions({
      // Capabilities that will show up in the notification and control center
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SeekTo,
        Capability.JumpForward,
        Capability.JumpBackward,
      ],
      
      // Capabilities that will show up when the notification is in the compact form on Android
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SeekTo,
      ],
      
      // Configure jump intervals
      forwardJumpInterval: 15, // 15 seconds forward
      backwardJumpInterval: 15, // 15 seconds backward
      
      // Whether the player should stop when the app is closed on Android
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
    });
    
    isSetup = true;
  }
  
  return isSetup;
}

/**
 * Add a track to the player
 */
export async function addTrack(track: {
  id: string;
  url: string;
  title: string;
  artist: string;
  artwork?: string;
  duration?: number;
}) {
  await TrackPlayer.add({
    id: track.id,
    url: track.url,
    title: track.title,
    artist: track.artist,
    artwork: track.artwork,
    duration: track.duration,
  });
}

/**
 * Play a specific track
 */
export async function playTrack(track: {
  id: string;
  url: string;
  title: string;
  artist: string;
  artwork?: string;
  duration?: number;
}) {
  try {
    // Reset the queue and add the new track
    await TrackPlayer.reset();
    await addTrack(track);
    await TrackPlayer.play();
  } catch (error) {
    console.error('Error playing track:', error);
    throw error;
  }
}

/**
 * Get current playback state
 */
export async function getPlaybackState() {
  return await TrackPlayer.getPlaybackState();
}

/**
 * Get current track
 */
export async function getCurrentTrack() {
  return await TrackPlayer.getActiveTrack();
}

/**
 * Get current position
 */
export async function getCurrentPosition() {
  return await TrackPlayer.getPosition();
}

/**
 * Get track duration
 */
export async function getDuration() {
  return await TrackPlayer.getDuration();
}

/**
 * Seek to position
 */
export async function seekTo(position: number) {
  await TrackPlayer.seekTo(position);
}

/**
 * Play
 */
export async function play() {
  await TrackPlayer.play();
}

/**
 * Pause
 */
export async function pause() {
  await TrackPlayer.pause();
}

/**
 * Stop
 */
export async function stop() {
  await TrackPlayer.stop();
}

/**
 * Set playback rate
 */
export async function setRate(rate: number) {
  await TrackPlayer.setRate(rate);
}
