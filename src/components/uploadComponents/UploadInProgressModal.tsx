import React from 'react';
import { Modal, View, ActivityIndicator } from 'react-native';
import LottieView from 'lottie-react-native';
import { StyledText } from '@/components/StyledText';
import { UploadProgress } from './types';

interface UploadInProgressModalProps {
  visible: boolean;
  progress: UploadProgress | null;
}

const UploadInProgressModal: React.FC<UploadInProgressModalProps> = ({ visible, progress }) => {
  const getProgressValue = () => {
    if (!progress) return 0;
    return progress.percentage;
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
    >
      <View className="flex-1 justify-center items-center bg-black/60">
        <View className="bg-white rounded-2xl p-8 w-4/5 items-center shadow-2xl">
          <StyledText className="text-2xl font-bold text-indigo-600 mb-4">
            {progress?.phase === 'complete' ? 'Upload Complete!' : 'Uploading...'}
          </StyledText>

          <LottieView
            source={require('../../../assets/animations/uploading.json')}
            autoPlay
            loop
            style={{ width: 150, height: 150, marginBottom: 16 }}
          />
          
          <View className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-4">
            <View 
              className="h-full bg-indigo-500"
              style={{ width: `${getProgressValue()}%` }}
            />
          </View>

          <StyledText className="text-base text-gray-700 mb-6">
            {progress?.message || 'Please wait...'}
          </StyledText>

          {progress?.phase !== 'complete' && (
            <ActivityIndicator size="large" color="#4F46E5" />
          )}
        </View>
      </View>
    </Modal>
  );
};

export default UploadInProgressModal;
