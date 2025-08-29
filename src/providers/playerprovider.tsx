import { setAudioModeAsync } from "expo-audio";
import { createContext, PropsWithChildren, useContext, useState, useEffect, useRef, useCallback } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from "../lib/supabase";
import TrackPlayer, { State, usePlaybackState, useProgress, useActiveTrack } from 'react-native-track-player';
import { playTrack as playTrackService, pause, play, seekTo as seekToService, setRate } from '@/services/trackPlayerService';

type PlayerContextType = {
    podcast: any;
    setPodcast: (podcast: any) => void; // For loading without playing
    playTrack: (podcast: any) => void; // For loading and playing
    seekTo: (position: number) => void;
    getViewCount: (podcastId: string) => Promise<number>;
    incrementViewCount: (podcastId: string) => Promise<void>;
    getAllViewCounts: () => Promise<Record<string, number>>;
    // New additions for playback control
    playbackRate: number;
    setPlaybackRate: (rate: number) => void;
    sleepTimerRemaining: number | null; // in seconds
    setSleepTimer: (duration: number | null) => void; // in minutes
    cancelSleepTimer: () => void;
    // Track Player specific
    isPlaying: boolean;
    isLoading: boolean;
    position: number;
    duration: number;
    togglePlayback: () => void;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export default function PlayerProvider({ children }: PropsWithChildren) {
    const [podcast, setPodcast] = useState<any | null>(null);
    
    // Track Player hooks
    const playbackState = usePlaybackState();
    const progress = useProgress();
    const activeTrack = useActiveTrack();

    // State for playback speed and sleep timer
    const [playbackRate, setPlaybackRateState] = useState(1.0);
    const sleepTimerIntervalId = useRef<ReturnType<typeof setInterval> | null>(null);
    const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
    // Refs for managing seek operations
    const seekTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastSeekTimeRef = useRef<number>(0);
    const isSeekingRef = useRef<boolean>(false);
    
    // Derived state from Track Player
    const isPlaying = playbackState.state === State.Playing;
    const isLoading = playbackState.state === State.Loading || playbackState.state === State.Buffering;
    const position = progress.position;
    const duration = progress.duration;

    // Constants for view count storage
    const VIEW_COUNT_KEY = 'podcast_view_counts';

    // Configure audio session for background playback using expo-audio (for recording compatibility)
    useEffect(() => {
        const configureAudio = async () => {
            try {
                // Set audio mode to allow background playback - this helps with recording compatibility
                await setAudioModeAsync({
                    allowsRecording: true, // Keep this true for recording functionality
                    playsInSilentMode: true, // Allow playback when device is in silent mode
                    shouldPlayInBackground: true, // This is the key setting for background playback
                    shouldRouteThroughEarpiece: false,
                    interruptionMode: 'doNotMix', // For iOS
                    interruptionModeAndroid: 'doNotMix', // For Android
                });
                console.log('Audio session configured for background playback');
            } catch (error) {
                console.error('Failed to configure audio session:', error);
            }
        };

        configureAudio();
    }, []);

    // Toggle playback function
    const togglePlayback = useCallback(async () => {
        try {
            if (isPlaying) {
                await pause();
            } else {
                await play();
            }
        } catch (error) {
            console.error('Failed to toggle playback:', error);
        }
    }, [isPlaying]);

    // Play track function using Track Player
    const playTrack = useCallback(async (newPodcast: any) => {
        try {
            setPodcast(newPodcast);
            
            // Determine the correct URI: use local file if available, otherwise stream
            const audioUri = newPodcast?.local_audio_url || newPodcast?.audio_url;
            
            if (!audioUri) {
                console.error('No audio URL found for podcast');
                return;
            }
            
            const track = {
                id: newPodcast.id || 'current-track',
                url: audioUri,
                title: newPodcast.title || 'Unknown Title',
                artist: newPodcast.creator_name || 'Unknown Artist',
                artwork: newPodcast.image_url,
                duration: newPodcast.duration,
            };
            
            await playTrackService(track);
        } catch (error) {
            console.error('Failed to play track:', error);
        }
    }, []);

    const seekTo = useCallback((position: number) => {
        // Clear any existing timeout
        if (seekTimeoutRef.current) {
            clearTimeout(seekTimeoutRef.current);
        }

        // Store the latest seek position
        lastSeekTimeRef.current = position;
                
        // Set seeking flag
        isSeekingRef.current = true;

        // Debounce the actual seek operation
        seekTimeoutRef.current = setTimeout(async () => {
            try {
                const seekPosition = lastSeekTimeRef.current;
                console.log(`Seeking to position: ${seekPosition}s`);
                                
                // Perform the seek operation using Track Player
                await seekToService(seekPosition);
                                
                // Reset seeking flag after a small delay to allow audio to stabilize
                setTimeout(() => {
                    isSeekingRef.current = false;
                }, 500);
                            
            } catch (error) {
                console.error('Seek operation failed:', error);
                isSeekingRef.current = false;
            }
        }, 200); // 200ms debounce delay
    }, []);

    // View count management functions
    const getViewCount = useCallback(async (podcastId: string): Promise<number> => {
        try {
            const storedCounts = await AsyncStorage.getItem(VIEW_COUNT_KEY);
            const counts = storedCounts ? JSON.parse(storedCounts) : {};
            return counts[podcastId] || 0;
        } catch (error) {
            console.error('Error getting view count:', error);
            return 0;
        }
    }, []);

    const incrementViewCount = useCallback(async (podcastId: string): Promise<void> => {
        try {
            // Increment view count locally
            const storedCounts = await AsyncStorage.getItem(VIEW_COUNT_KEY);
            const counts = storedCounts ? JSON.parse(storedCounts) : {};
            counts[podcastId] = (counts[podcastId] || 0) + 1;
            await AsyncStorage.setItem(VIEW_COUNT_KEY, JSON.stringify(counts));
            console.log(`View count incremented for ${podcastId}: ${counts[podcastId]}`);

            // Call Supabase RPC to increment view count in the database
            const { data, error } = await supabase.rpc('increment_view_count', {
                podcast_id_to_update: podcastId,
            });

            if (error) {
                console.error('Error incrementing view count on server:', error);
            } else {
                console.log('View count incremented on server:', data);
            }
        } catch (error) {
            console.error('Error incrementing view count:', error);
        }
    }, []);

    const getAllViewCounts = useCallback(async (): Promise<Record<string, number>> => {
        try {
            const storedCounts = await AsyncStorage.getItem(VIEW_COUNT_KEY);
            return storedCounts ? JSON.parse(storedCounts) : {};
        } catch (error) {
            console.error('Error getting all view counts:', error);
            return {};
        }
    }, []);

    // Function to set playback rate using Track Player
    const setPlaybackRate = useCallback(async (rate: number) => {
        try {
            await setRate(rate);
            setPlaybackRateState(rate);
        } catch (error) {
            console.error('Failed to set playback rate:', error);
        }
    }, []);

    // Function to set a sleep timer
    const setSleepTimer = useCallback((duration: number | null) => {
        // Cancel any existing timer first
        if (sleepTimerIntervalId.current) {
            clearInterval(sleepTimerIntervalId.current);
        }

        if (duration === null) {
            sleepTimerIntervalId.current = null;
            setSleepTimerRemaining(null);
            return;
        }

        const initialSeconds = duration * 60;
        setSleepTimerRemaining(initialSeconds);

        const intervalId = setInterval(() => {
            setSleepTimerRemaining(prevSeconds => {
                if (prevSeconds === null || prevSeconds <= 1) {
                    clearInterval(intervalId);
                    pause(); // Use Track Player pause
                    return null; // End of timer
                }
                return prevSeconds - 1;
            });
        }, 1000);

        sleepTimerIntervalId.current = intervalId;
    }, []);

    // Function to cancel the sleep timer
    const cancelSleepTimer = () => {
        if (sleepTimerIntervalId.current) {
            clearInterval(sleepTimerIntervalId.current);
            sleepTimerIntervalId.current = null;
            setSleepTimerRemaining(null);
        }
    };

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (seekTimeoutRef.current) {
                clearTimeout(seekTimeoutRef.current);
            }
            if (sleepTimerIntervalId.current) {
                clearInterval(sleepTimerIntervalId.current);
            }
        };
    }, []);

    return (
        <PlayerContext.Provider value={{ 
            podcast, 
            setPodcast,
            playTrack, 
            seekTo,
            getViewCount,
            incrementViewCount,
            getAllViewCounts,
            // Playback control
            playbackRate,
            setPlaybackRate,
            sleepTimerRemaining,
            setSleepTimer,
            cancelSleepTimer,
            // Track Player specific
            isPlaying,
            isLoading,
            position,
            duration,
            togglePlayback
        }}>
            {children}
        </PlayerContext.Provider>
    );
}

export const usePlayer = (): PlayerContextType => {
    const context = useContext(PlayerContext);
        
    if (!context) {
        throw new Error('usePlayer must be used within a PlayerProvider');
    }
        
    return context;
};