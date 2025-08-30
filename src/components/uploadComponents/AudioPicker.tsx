import React from 'react';
import { View, Pressable, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';
import { StyledText } from '@/components/StyledText';
import { AudioFile } from './types';

interface AudioPickerProps {
  audio: AudioFile | null;
  onSetAudio: (file: AudioFile | null) => void;
  disabled: boolean;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(value >= 100 ? 0 : 2)} ${sizes[i]}`;
};

const AudioPickerComponent: React.FC<AudioPickerProps> = ({ audio, onSetAudio, disabled }) => {

  const pickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const audioFile = result.assets[0];
        onSetAudio({
          uri: audioFile.uri,
          name: audioFile.name,
          size: audioFile.size,
          mimeType: audioFile.mimeType,
        });
      }
    } catch (error) {
      console.error('Error picking audio:', error);
      Alert.alert('Error', 'فشل في اختيار ملف الصوت. يرجى المحاولة مرة أخرى.');
    }
  };

  const removeAudio = () => {
    onSetAudio(null);
  };

  return (
    <View>
      <StyledText className="text-gray-700 font-semibold mb-2 text-right">الملف الصوتي *</StyledText>
      <Pressable 
        onPress={pickAudio}
        disabled={disabled}
        className={`bg-white p-6 rounded-2xl border-2 border-indigo-400 items-center shadow-sm ${
          disabled ? 'opacity-50' : ''
        }`}
      >
        {audio ? (
          <View className="items-center w-full">
            <View className="bg-blue-100 rounded-full p-3 mb-3">
              <Feather name="music" size={24} color="#3B82F6" />
            </View>
            <StyledText className="text-lg font-semibold text-gray-800 text-center mt-2" numberOfLines={1}>
              {audio.name}    
            </StyledText>
            <StyledText className="text-gray-500 text-sm mt-1">
              {audio.size ? formatFileSize(audio.size) : 'حجم غير معروف'}
            </StyledText>
            <Pressable 
              onPress={removeAudio}
              disabled={disabled}
              className="mt-3 bg-red-100 px-3 py-1 rounded-full"
            >
              <StyledText className="text-red-600 text-sm">حذف</StyledText>
            </Pressable>
          </View>
        ) : (
          <View className="items-center">
            <Feather name="upload-cloud" size={32} color="#9CA3AF" />
            <StyledText className="text-lg font-semibold text-gray-800 mt-2">
              اختر ملف الصوت
            </StyledText>
            <StyledText className="text-gray-500 text-sm mt-1">
              MP3, WAV, AAC, M4A, الخ....  
            </StyledText>
          </View>
        )}
      </Pressable>
    </View>
  );
};

export default AudioPickerComponent;
