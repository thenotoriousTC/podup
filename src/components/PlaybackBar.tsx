import { View, Pressable, GestureResponderEvent } from 'react-native';
import React, { useState } from 'react';
import { StyledText } from './StyledText';

type PlaybackBarProps = {
    currentTime: number;
    duration: number;
    onSeek?: (seconds: number) => void;
}

export default function PlaybackBar({ currentTime, duration, onSeek }: PlaybackBarProps) {
    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
    
    const dur = Number.isFinite(duration) && duration > 0 ? duration : 0;
    const clampedCurrent = Math.min(
        Math.max(Number.isFinite(currentTime) ? currentTime : 0, 0),
        dur
    );
    const progress = dur > 0 ? clampedCurrent / dur : 0;

    const [barWidth, setBarWidth] = useState(0);

    function onHandleSeek(event: GestureResponderEvent) {
        if (!onSeek || barWidth <= 0 || duration <= 0) return;
        const { locationX } = event.nativeEvent;
        const clampedX = Math.min(Math.max(locationX, 0), barWidth);
        const t = (clampedX / barWidth) * duration;
        const clampedT = Math.min(Math.max(t, 0), duration);
        onSeek(clampedT);
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
                    style={{ width: `${progress * 100}%` }}
                />
                <View
                    className='absolute w-4 h-4 -translate-x-1/2 rounded-full bg-indigo-400'
                    style={{ left: `${progress * 100}%` }}
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
