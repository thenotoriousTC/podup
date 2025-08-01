import { View ,Pressable, GestureResponderEvent} from 'react-native';
type PlaybackBarProps = {
    currentTime: number;
    duration: number;
    onSeek?: (seconds: number) => void;
}
import React, { useRef, useState } from 'react';
import { StyledText } from './StyledText';
export default function PlaybackBar({ currentTime,duration,onSeek  }:PlaybackBarProps)  {

    

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
    const value = currentTime   / duration;

    const [barWidth, setBarWidth] = useState(0);

    function onHandleSeek(event: GestureResponderEvent) {
        const locationX = event.nativeEvent.locationX;
        if (barWidth > 0) {
            onSeek?.((locationX / barWidth) * duration);
        }
    }

    return (
        <View>
            <Pressable
            hitSlop={50}
                onPress={onHandleSeek}
                onLayout={e => setBarWidth(e.nativeEvent.layout.width)}
                className='w-full bg-slate-900 h-2 rounded-full justify-center'
            >
                <View
                    className='bg-blue-400 h-full rounded-full'
                    style={{ width: `${value * 100}%` }}
                />
                <View
                    className='absolute w-4 h-4 -translate-x-1/2 rounded-full bg-indigo-400'
                    style={{ left: `${value * 100}%` }}
                />
            </Pressable>
            <View className='flex-row justify-between mt-2'>
                <StyledText className='text-xs text-gray-500 mt-1'>
                    {formatTime(currentTime)} 
                </StyledText>
                <StyledText className='text-xs text-gray-500'>
                    {formatTime(duration)}
                </StyledText>
            </View>
        </View>
    );
}
