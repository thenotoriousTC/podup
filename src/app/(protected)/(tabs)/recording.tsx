import React, { useEffect } from 'react';
import { View, ScrollView, KeyboardAvoidingView, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { StyledText } from '@/components/StyledText';
import { Ionicons } from '@expo/vector-icons';

// Import new hooks
import { useRecordingState } from '@/components/recordingcomponents/useRecordingState';
import { useAudioRecording } from '@/components/recordingcomponents/useAudioRecording';
import { useRecordingUpload } from '@/components/recordingcomponents/useRecordingUpload';

// Import new components
import RecordingControls from '@/components/recordingcomponents/RecordingControls';
import RecordingsList from '@/components/recordingcomponents/RecordingsList';
import MetadataForm from '@/components/recordingcomponents/MetadataForm';
import CategoryModal from '@/components/recordingcomponents/CategoryModal';
import UploadInProgressModal from '@/components/uploadComponents/UploadInProgressModal'; // Reusing from upload components

export default function RecordingScreen() {
  const { user: currentUser } = useAuth();

  // State and form management hook
  const {
    podcastTitle, setPodcastTitle,
    podcastDescription, setPodcastDescription,
    podcastImage, setPodcastImage,
    category, setCategory,
    showMetadataForm,
    isCategoryModalVisible, setCategoryModalVisible,
    selectedRecording,
    scrollViewRef,
    metadataFormRef,
    resetForm,
    selectRecordingForPublish,
  } = useRecordingState();

  // Audio recording and management hook
  const {
    isRecording,
    hasPermission,
    recordingDuration,
    recordings,
    currentPlayingId,
    playerStatus,
    loadSavedRecordings,
    startRecording,
    stopRecording,
    playRecording,
    deleteRecording,
  } = useAudioRecording(currentUser);

  // Upload management hook
  const {
    isUploading,
    uploadProgress,
    publishRecording,
  } = useRecordingUpload();

  // Initial data loading
  useEffect(() => {
    if (currentUser?.id) {
      loadSavedRecordings();
    }
  }, [currentUser]);

  const handleStopRecording = async () => {
    const newRecording = await stopRecording();
    if (newRecording) {
      Alert.alert(
        "Recording Saved!",
        "Your recording has been saved. You can now publish it.",
        [{ text: "OK" }]
      );
      selectRecordingForPublish(newRecording);
    }
  };

  const handleDeleteRecording = async (recordingId: string) => {
    Alert.alert(
      "Delete Recording",
      "Are you sure you want to delete this recording?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteRecording(recordingId);
            if (selectedRecording?.id === recordingId) {
              resetForm();
            }
            Alert.alert("Deleted", "Recording deleted successfully.");
          }
        }
      ]
    );
  };

  const handlePublish = () => {
    publishRecording({
      podcastTitle,
      podcastDescription,
      podcastImage,
      category,
      selectedRecording,
    }, () => {
      // On successful upload, delete the local file and reset the form
      if (selectedRecording) {
        deleteRecording(selectedRecording.id);
      }
      resetForm();
    });
  };

  if (!currentUser) {
    return (
      <View className="flex-1 bg-slate-50 justify-center items-center">
        <Ionicons name="person-circle-outline" size={64} color="#007AFF" />
        <StyledText className="text-xl font-semibold text-red-500 mt-4 mb-2 text-center">
          Please log in to record audio
        </StyledText>
      </View>
    );
  }

  if (hasPermission === null) {
    return (
      <View className="flex-1 bg-slate-50 justify-center items-center">
        <ActivityIndicator size="large" color="#007AFF" />
        <StyledText className="mt-4 text-base text-blue-500">
          Requesting Permissions...
        </StyledText>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View className="flex-1 bg-slate-50 justify-center items-center">
        <Ionicons name="mic-off" size={64} color="#FF3B30" />
        <StyledText className="text-xl font-semibold text-red-500 mt-4 mb-2 text-center">
          Microphone Permission Denied
        </StyledText>
        <StyledText className="text-base text-gray-600 text-center max-w-[80%]">
          Please enable microphone access in your device settings.
        </StyledText>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={'height'} className="flex-1">
      <ScrollView ref={scrollViewRef} className="flex-1 bg-slate-50 pt-10">
        <View className="p-4">
          <View className="items-center mb-8 pt-5">
            <StyledText className="text-base text-gray-600 text-center">
              Record, manage, and publish your content
            </StyledText>
          </View>

          <RecordingControls
            isRecording={isRecording}
            isUploading={isUploading}
            recordingDuration={recordingDuration}
            onStart={startRecording}
            onStop={handleStopRecording}
          />

          <RecordingsList
            recordings={recordings}
            currentPlayingId={currentPlayingId}
            isPlayerPlaying={playerStatus.playing}
            isUploading={isUploading}
            onPlay={playRecording}
            onDelete={handleDeleteRecording}
            onSelectForPublish={selectRecordingForPublish}
          />

          {showMetadataForm && (
            <View ref={metadataFormRef}>
              <MetadataForm
                podcastTitle={podcastTitle}
                setPodcastTitle={setPodcastTitle}
                podcastDescription={podcastDescription}
                setPodcastDescription={setPodcastDescription}
                podcastImage={podcastImage}
                setPodcastImage={setPodcastImage}
                category={category}
                onCategoryPress={() => setCategoryModalVisible(true)}
                isUploading={isUploading}
                onPublish={handlePublish}
                onCancel={resetForm}
              />
            </View>
          )}
        </View>
      </ScrollView>

      <CategoryModal
        visible={isCategoryModalVisible}
        onClose={() => setCategoryModalVisible(false)}
        onSelectCategory={setCategory}
      />

      <UploadInProgressModal
        visible={isUploading}
        progress={uploadProgress}
      />
    </KeyboardAvoidingView>
  );
}