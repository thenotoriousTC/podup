import { AudioPlayer, useAudioPlayer, setAudioModeAsync } from "expo-audio";
import { createContext, PropsWithChildren, useContext, useState, useEffect, useRef, useCallback } from "react";

type PlayerContextType = {
    player: AudioPlayer;
    podcast: any;
    setPodcast: (podcast: any) => void;
    seekTo: (position: number) => void;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export default function PlayerProvider({ children }: PropsWithChildren) {
    const [podcast, setPodcast] = useState<any | null>(null);
    
    // Refs for managing seek operations
    const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastSeekTimeRef = useRef<number>(0);
    const isSeekingRef = useRef<boolean>(false);

    // Configure audio session for background playback using expo-audio
    useEffect(() => {
        const configureAudio = async () => {
            try {
                // Set audio mode to allow background playback using expo-audio
                await setAudioModeAsync({
                    allowsRecording: false,
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

    // Determine the correct URI: use local file if available, otherwise stream.
    const audioUri = podcast?.local_audio_url || podcast?.audio_url;

    const player = useAudioPlayer({ 
        uri: audioUri,
    });

    // Debounced seek function to prevent rapid seeking issues
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
                
                // Perform the seek operation
                await player.seekTo(seekPosition);
                
                // Reset seeking flag after a small delay to allow audio to stabilize
                setTimeout(() => {
                    isSeekingRef.current = false;
                }, 500);
                
            } catch (error) {
                console.error('Seek operation failed:', error);
                isSeekingRef.current = false;
            }
        }, 200); // 200ms debounce delay
    }, [player]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (seekTimeoutRef.current) {
                clearTimeout(seekTimeoutRef.current);
            }
        };
    }, []);

    return (
        <PlayerContext.Provider value={{ player, podcast, setPodcast, seekTo }}>
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