import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { TouchableOpacity } from '@/components/TouchableOpacity';
import { Ionicons } from '@expo/vector-icons';
import { StyledText } from '@/components/StyledText';

interface RecordingControlsProps {
  isRecording: boolean;
  isUploading: boolean;
  onStart: () => void;
  onStop: () => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const RecordingControls: React.FC<RecordingControlsProps> = ({ 
  isRecording, 
  isUploading, 
  onStart, 
  onStop 
}) => {
  const [recordingDuration, setRecordingDuration] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording]);
  return (
    <View className="bg-white rounded-2xl p-6 shadow-lg items-center mb-8">
      <View className={`w-32 h-32 rounded-full justify-center items-center mb-6 ${
        isRecording ? 'bg-red-50 border-4 border-red-500' : 'bg-white border-4 border-indigo-400'
      }`}>
        <Ionicons 
          name={isRecording ? "mic" : "mic"} 
          size={64} 
          color={isRecording ? "#FF3B30" : "#4F46E5"} 
        />
      </View>
      
      <StyledText className="text-2xl font-semibold text-indigo-500 mb-3 text-center">
        {isRecording ? " جاري التسجيل" : "جاهز للتسجيل"}
      </StyledText>
      {isRecording && (
        <StyledText className="text-2xl font-semibold text-indigo-500 mb-3">
          {formatTime(recordingDuration)}
        </StyledText>
      )}
      
      <TouchableOpacity 
        className={`px-8 py-4 rounded-full mt-3 ${
          isRecording ? 'bg-red-500' : 'bg-indigo-500'
        } ${isUploading ? 'opacity-50' : ''}`}
        onPress={isRecording ? onStop : onStart}
        disabled={isUploading}
      >
        <StyledText className="text-white text-lg font-semibold">
          {isRecording ? "إيقاف التسجيل" : "بدء التسجيل"}
        </StyledText>
      </TouchableOpacity>
    </View>
  );
};

export default RecordingControls;
