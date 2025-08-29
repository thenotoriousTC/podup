import React from 'react';
import { View, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StyledText } from '@/components/StyledText';
import { UploadProgress } from './types';

const { width: screenWidth } = Dimensions.get('window');

interface ProgressBarProps {
  progress: UploadProgress;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const progressWidth = (progress.percentage / 100) * (screenWidth - 48); // 48px for padding

  return (
    <View className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
      <View className="items-center mb-4">
        <View className="flex-row items-center mb-2">
          <MaterialIcons 
            name={
              progress.phase === 'image' ? 'image' : 
              progress.phase === 'audio' ? 'audiotrack' : 
              progress.phase === 'database' ? 'storage' : 'check-circle'
            } 
            size={24} 
            color={progress.percentage === 100 ? '#10B981' : '#3B82F6'} 
          />
          <StyledText className="text-lg font-semibold text-gray-800 ml-2">
            {progress.message}
          </StyledText>
        </View>
        
        <View className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <View 
            className={`h-full rounded-full transition-all duration-300 ${
              progress.percentage === 100 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: progressWidth }}
          />
        </View>
        
        <StyledText className="text-sm text-gray-600 mt-2">
          {Math.round(progress.percentage)}% مكتمل
        </StyledText>
      </View>
      
      {progress.phase !== 'complete' && (
        <View className="flex-row items-center justify-center">
          <MaterialIcons name="hourglass-empty" size={16} color="#9CA3AF" />
          <StyledText className="text-sm text-gray-500 ml-1">
            يرجى عدم إغلاق التطبيق أثناء التحميل
          </StyledText>
        </View>
      )}
    </View>
  );
};

export default ProgressBar;
