import dummybooks from "@/dummybooks";
import { AudioPlayer, useAudioPlayer } from "expo-audio";
import { createContext, PropsWithChildren, useContext, useState } from "react";

type PlayerContextType = {
    player : AudioPlayer;
   // playerStatus : AudioPlayerStatus ;
   podcast : any;
   setPodcast : (podcast : any) => void;
};

const PlayerContext = createContext<PlayerContextType | undefined >(undefined);


export default function PlayerProvider({ children }:  PropsWithChildren ) {
     const [podcast,setPodcast] = useState<any|null>(null);
    

       const player = useAudioPlayer({ uri: podcast?.audio_url });


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
