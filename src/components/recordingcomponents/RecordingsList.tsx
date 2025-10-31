import React from 'react';
import { View } from 'react-native';
import { TouchableOpacity } from '@/components/TouchableOpacity';
import { Feather, Ionicons } from '@expo/vector-icons';
import { StyledText } from '@/components/StyledText';
import { Recording } from './types';

interface RecordingsListProps {
  recordings: Recording[];
  currentPlayingId: string | null;
  isPlayerPlaying: boolean;
  isUploading: boolean;
  onPlay: (recording: Recording) => void;
  onDelete: (recordingId: string) => void;
  onSelectForPublish: (recording: Recording) => void;
}

const formatTime = (seconds: number) => {
  const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const RecordingsList: React.FC<RecordingsListProps> = ({ 
  recordings, 
  currentPlayingId, 
  isPlayerPlaying, 
  isUploading, 
  onPlay, 
  onDelete, 
  onSelectForPublish 
}) => {
  if (recordings.length === 0) {
    return null;
  }

  return (
    <View className="bg-white rounded-2xl p-5 mb-8 shadow-lg">
      <StyledText className="text-xl font-semibold text-gray-800 mb-4 text-center">
        تسجيلاتك ({recordings.length})
      </StyledText>
      
      {recordings.map((recording) => (
        <View key={recording.id} className="flex-row items-center justify-between p-3 mb-3 bg-gray-50 rounded-xl">
          <View className="flex-1 mr-3">
            <StyledText className="text-base font-semibold text-gray-800 mb-1">
              {recording.title}
            </StyledText>
            <StyledText className="text-sm text-gray-500">
              {formatDate(recording.createdAt)} • {formatTime(recording.duration)}
            </StyledText>
          </View>
          
          <View className="flex-row items-center">
            <TouchableOpacity
              className="p-2 mr-2"
              onPress={() => onPlay(recording)}
              disabled={isUploading}
            >
              <Feather
                name={currentPlayingId === recording.id && isPlayerPlaying ? "pause" : "play"}
                size={24}
                color="black"
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              className="p-2 mr-2"
              onPress={() => onSelectForPublish(recording)}
              disabled={isUploading}
            >
              <Ionicons name="cloud-upload-outline" size={24} color="#FD842B" />
            </TouchableOpacity>
            
            <TouchableOpacity
              className="p-2"
              onPress={() => onDelete(recording.id)}
              disabled={isUploading}
            >
              <Ionicons name="trash" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
};

export default RecordingsList;
