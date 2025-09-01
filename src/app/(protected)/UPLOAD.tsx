import { View, Pressable, ScrollView, Dimensions, KeyboardAvoidingView } from 'react-native';
import React from 'react';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { StyledText } from '@/components/StyledText';

import { useUploadState } from '@/components/uploadComponents/useUploadState';
import { usePodcastUpload } from '@/components/uploadComponents/usePodcastUpload';
import ImagePickerComponent from '@/components/uploadComponents/ImagePicker';
import AudioPickerComponent from '@/components/uploadComponents/AudioPicker';
import PodcastFormComponent from '@/components/uploadComponents/PodcastForm';
import CategoryModal from '@/components/uploadComponents/CategoryModal';
import UploadInProgressModal from '@/components/uploadComponents/UploadInProgressModal';

const { height: screenHeight } = Dimensions.get('window');

const UploadScreen = () => {
  const {
    currentUser,
    title, setTitle,
    author, setAuthor,
    description, setDescription,
    image, setImage,
    audio, setAudio,
    category, setCategory,
    isCategoryModalVisible, setCategoryModalVisible,
    resetState
  } = useUploadState();

  const { isUploading, uploadProgress, handleUpload } = usePodcastUpload();

  const onUpload = () => {
    handleUpload({
      currentUser,
      title,
      author,
      description,
      category,
      image,
      audio,
      onUploadComplete: resetState,
    });
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: true, headerTitle: "   " }} />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior='padding'
        keyboardVerticalOffset={0}
      >
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ 
            paddingBottom: 24,
            flexGrow: 1, 
            minHeight: screenHeight - 100 
          }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isUploading}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View className="p-6 space-y-6">
            <View className="items-center mb-4">
              <StyledText className="text-2xl font-semibold text-indigo-600">تحميل</StyledText>
              <StyledText className="text-gray-600 mt-1">شارك قصتك مع العالم</StyledText>
            </View>

            <ImagePickerComponent image={image} onSetImage={setImage} disabled={isUploading} />

            <AudioPickerComponent audio={audio} onSetAudio={setAudio} disabled={isUploading} />

            <PodcastFormComponent 
              title={title} setTitle={setTitle}
              author={author} setAuthor={setAuthor}
              description={description} setDescription={setDescription}
              category={category} onCategoryPress={() => setCategoryModalVisible(true)}
              disabled={isUploading}
            />



            <Pressable 
              className={`p-4 rounded-2xl items-center mt-6 shadow-sm ${
                isUploading ? 'bg-gray-400' : 'bg-indigo-500'
              }`}
              onPress={onUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <View className="flex-row items-center">
                  <MaterialIcons name="hourglass-empty" size={20} color="white" />
                  <StyledText className="text-white font-semibold text-lg ml-2">جاري التحميل...</StyledText>
                </View>
              ) : (
                <View className="flex-row items-center">
                  <Feather name="upload" size={20} color="white" />
                  <StyledText className="text-white font-semibold text-lg ml-2">تحميل</StyledText>
                </View>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CategoryModal 
        visible={isCategoryModalVisible && !isUploading}
        onClose={() => setCategoryModalVisible(false)}
        onSelectCategory={setCategory}
      />

      <UploadInProgressModal 
        visible={isUploading}
        progress={uploadProgress}
      />
    </View>
  );
};

export default UploadScreen;