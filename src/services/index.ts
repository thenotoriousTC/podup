import TrackPlayer, { Event } from 'react-native-track-player';

/**
 * PlaybackService - handles remote control events from notifications and control center
 * Based on official React Native Track Player documentation
 */
export const PlaybackService = async function() {
  // Handle remote play event
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    TrackPlayer.play();
  });

  // Handle remote pause event
  TrackPlayer.addEventListener(Event.RemotePause, () => {
    TrackPlayer.pause();
  });

  // Handle remote stop event
  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    TrackPlayer.stop();
  });

  // Handle remote next track event
  TrackPlayer.addEventListener(Event.RemoteNext, async () => {
    try {
      await TrackPlayer.skipToNext();
    } catch (e) {
      console.warn('skipToNext failed (likely end of queue):', e);
    }
  });

  // Handle remote previous track event
  TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
    try {
      await TrackPlayer.skipToPrevious();
    } catch (e) {
      console.warn('skipToPrevious failed (likely start of queue):', e);
    }
  });

  // Handle remote seek event
  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
    TrackPlayer.seekTo(event.position);
  });

  // Handle remote jump forward event
  TrackPlayer.addEventListener(Event.RemoteJumpForward, (event) => {
    TrackPlayer.seekBy(event.interval);
  });

  // Handle remote jump backward event
  TrackPlayer.addEventListener(Event.RemoteJumpBackward, (event) => {
    TrackPlayer.seekBy(-event.interval);
  });

  // Handle playback errors
  TrackPlayer.addEventListener(Event.PlaybackError, (event) => {
    console.error('Playback error:', event);
  });

  // Handle when playback queue ends
  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
    console.log('Playback queue ended');
  });
};
