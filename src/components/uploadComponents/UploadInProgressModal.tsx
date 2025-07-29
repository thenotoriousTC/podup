import React from 'react';
import { Modal, View } from 'react-native';
import LottieView from 'lottie-react-native';
import ProgressBar from './ProgressBar';
import { StyledText } from '../StyledText';
import { UploadProgress } from './types';

interface UploadInProgressModalProps {
  visible: boolean;
  progress: UploadProgress | null;
}

const UploadInProgressModal: React.FC<UploadInProgressModalProps> = ({ visible, progress }) => {
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white p-8 rounded-2xl items-center w-4/5 shadow-lg">
          <LottieView
            source={require('../../../assets/animations/uploading.json')}
            autoPlay
            loop
            style={{ width: 150, height: 150 }}
          />
          <StyledText className="text-xl font-bold text-gray-800 mt-4">جاري التحميل...</StyledText>
          <StyledText className="text-gray-600 mb-4">يرجى الانتظار قليلاً</StyledText>
          {progress && <ProgressBar progress={progress} />}
        </View>
      </View>
    </Modal>
  );
};

export default UploadInProgressModal;
