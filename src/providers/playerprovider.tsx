import { AudioPlayer, useAudioPlayer, setAudioModeAsync } from "expo-audio";
import { createContext, PropsWithChildren, useContext, useState, useEffect } from "react";

type PlayerContextType = {
    player : AudioPlayer;
   // playerStatus : AudioPlayerStatus ;
   podcast : any;
   setPodcast : (podcast : any) => void;
};

const PlayerContext = createContext<PlayerContextType | undefined >(undefined);

export default function PlayerProvider({ children }:  PropsWithChildren ) {
     const [podcast,setPodcast] = useState<any|null>(null);
    
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
            } catch (error) {
                console.error('Failed to configure audio session:', error);
            }
        };

        configureAudio();
    }, []);

    const player = useAudioPlayer({ 
        uri: podcast?.audio_url,
    });

    return  (
        <PlayerContext.Provider value={{player,podcast,setPodcast}}>
            {children}
        </PlayerContext.Provider>
    )
}

export const usePlayer = (): PlayerContextType => {
    const context = useContext(PlayerContext);
    
    if (!context) {
        throw new Error('usePlayer must be used within a PlayerProvider');
    }
    
    return context;
};