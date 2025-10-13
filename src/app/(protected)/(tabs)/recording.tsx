import React, { useState, useEffect, useRef } from 'react';
import { View, Alert, ActivityIndicator, KeyboardAvoidingView, ScrollView } from 'react-native';
import { TouchableOpacity } from '@/components/TouchableOpacity';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers/AuthProvider';
import { StyledText } from '@/components/StyledText';
import { useFocusEffect } from '@react-navigation/native';

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
  console.log('🟨 [DEBUG] RecordingScreen: Component rendering/re-rendering');
  const { user: currentUser } = useAuth();
  console.log('🟨 [DEBUG] RecordingScreen: currentUser:', !!currentUser?.id);

  // Audio recording and management hook
  const {
    isRecording,
    hasPermission,
    recordings,
    setRecordings, // Expose setter for reset logic
    currentPlayingId,
    playerStatus,
    loadSavedRecordings,
    startRecording,
    stopRecording,
    playRecording,
    deleteRecording,
    requestPermission,
  } = useAudioRecording(currentUser);

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
  } = useRecordingState(setRecordings);

  // Upload management hook
  const {
    isUploading,
    uploadProgress,
    publishRecording,
  } = useRecordingUpload();

  // Debug state logging
  console.log('🟦 [DEBUG] RecordingScreen state:', {
    isRecording,
    hasPermission,
    recordingsCount: recordings.length,
    showMetadataForm,
    selectedRecordingId: selectedRecording?.id,
    isUploading,
    uploadProgress: uploadProgress?.percentage,
    currentPlayingId,
  });

  // Initial data loading
  useEffect(() => {
    console.log('🚀 [PERF] Initial useEffect triggered, currentUser:', !!currentUser?.id);
    if (currentUser?.id) {
      console.log('🚀 [PERF] Loading initial recordings...');
      loadSavedRecordings();
    }
  }, [currentUser]);

  // Refresh recordings when tab becomes focused
  useFocusEffect(
    React.useCallback(() => {
      console.log('🎯 [DEBUG] useFocusEffect triggered for recording tab');
      console.log('🎯 [DEBUG] useFocusEffect: currentUser:', !!currentUser?.id);
      console.log('🎯 [DEBUG] useFocusEffect: recordings count before load:', recordings.length);
      console.log('🎯 [DEBUG] useFocusEffect: showMetadataForm:', showMetadataForm);
      console.log('🎯 [DEBUG] useFocusEffect: selectedRecording:', selectedRecording?.id);
      
      if (currentUser?.id) {
        console.log('🎯 [DEBUG] useFocusEffect: Loading recordings on focus...');
        loadSavedRecordings();
      } else {
        console.log('🎯 [DEBUG] useFocusEffect: No user, skipping recordings load');
      }
    }, [currentUser?.id, recordings.length, showMetadataForm, selectedRecording?.id])
  );

  const handleStopRecording = async () => {
    console.log('🛑 [PERF] handleStopRecording: START');
    const startTime = Date.now();
    try {
      console.log('🛑 [PERF] Calling stopRecording...');
      const newRecording = await stopRecording();
      console.log('🛑 [PERF] stopRecording returned:', !!newRecording);
      if (newRecording) {
        console.log('🛑 [PERF] Selecting recording for publish...');
        selectRecordingForPublish(newRecording);
        console.log('🛑 [PERF] Showing success alert...');
        Alert.alert("تم الحفظ", "تم حفظ التسجيل. يمكنك الآن نشره.", [{ text: "حسنًا" }]);
      }
      console.log('✅ [PERF] handleStopRecording: COMPLETE in', Date.now() - startTime, 'ms');
    } catch (error) {
      console.error('❌ [PERF] handleStopRecording error:', error);
      console.log('❌ [PERF] handleStopRecording: FAILED in', Date.now() - startTime, 'ms');
      Alert.alert("فشل الإيقاف", "تعذّر إيقاف التسجيل. حاول مجددًا.");
    }
  };

  const handleDeleteRecording = async (recordingId: string) => {
    Alert.alert(
      "حذف التسجيل",
      "هل أنت متأكد من حذف هذا التسجيل؟ لا يمكن التراجع.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRecording(recordingId);
              if (selectedRecording?.id === recordingId) {
                resetForm();
              }
              Alert.alert("تم الحذف", "تم حذف التسجيل بنجاح.");
            } catch (e) {
              Alert.alert("فشل الحذف", "حدث خطأ أثناء حذف التسجيل. حاول مجدداً.");
            }
          }
        }
      ]
    );
  };

  const handlePublish = () => {
    console.log('📤 [DEBUG] handlePublish: START');
    console.log('📤 [DEBUG] handlePublish: selectedRecording:', selectedRecording?.id);
    console.log('📤 [DEBUG] handlePublish: recordings before:', recordings.length);
    
    if (!selectedRecording) {
      console.log('❌ [DEBUG] handlePublish: No selected recording');
      Alert.alert("لا يوجد تسجيل", "يرجى اختيار تسجيل للنشر.", [{ text: "حسنًا" }]);
      return;
    }
    
    console.log('📤 [DEBUG] handlePublish: Starting upload...');
    publishRecording({
      podcastTitle,
      podcastDescription,
      podcastImage,
      category,
      selectedRecording,
    }, async () => {
      console.log('✅ [DEBUG] handlePublish: Upload successful, starting cleanup...');
      console.log('🗑️ [DEBUG] handlePublish: recordings before delete:', recordings.length);
      
      // On successful upload, delete the local file and reset the form
      try {
        console.log('🗑️ [DEBUG] handlePublish: Deleting recording:', selectedRecording.id);
        await deleteRecording(selectedRecording.id);
        console.log('✅ [DEBUG] handlePublish: Recording deleted successfully');
      } catch (error) {
        console.error('❌ [DEBUG] handlePublish: Delete error:', error);
        Alert.alert("تعذّر الحذف محليًا", "تم النشر بنجاح لكن تعذّر حذف الملف من جهازك.");
      } finally {
        console.log('🔄 [DEBUG] handlePublish: Calling resetForm...');
        resetForm();
        console.log('🔄 [DEBUG] handlePublish: resetForm completed');
        console.log('📤 [DEBUG] handlePublish: COMPLETE');
      }
    });
  };

  if (!currentUser) {
    return (
      <View className="flex-1 bg-slate-50 justify-center items-center">
        <Ionicons name="person-circle-outline" size={64} color="#007AFF" />
        <StyledText className="text-xl font-semibold text-red-500 mt-4 mb-2 text-center">
          يرجى تسجيل الدخول لتسجيل الصوت
        </StyledText>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View className="flex-1 bg-slate-50 justify-center items-center p-6">
        <Ionicons name="mic-off" size={64} color="#EF4444" />
        <StyledText className="text-xl font-semibold text-red-500 mt-4 mb-2 text-center">
          نحتاج إلى الوصول للميكروفون
        </StyledText>
        <StyledText className="text-base text-gray-600 mb-6 text-center">
          يرجى السماح بالوصول إلى الميكروفون لتتمكن من تسجيل الصوت
        </StyledText>
        <TouchableOpacity 
          className="bg-indigo-600 px-6 py-3 rounded-lg"
          onPress={async () => {
            const granted = await requestPermission();
            if (!granted) {
              Alert.alert(
                "الإذن مرفوض", 
                "يرجى الذهاب إلى الإعدادات والسماح بالوصول للميكروفون.",
                [{ text: "حسنًا" }]
              );
            }
          }}
        >
          <StyledText className="text-white text-base font-semibold">
            السماح بالوصول
          </StyledText>
        </TouchableOpacity>
      </View>
    );
  }

  if (hasPermission === null) {
    return (
      <View className="flex-1 bg-slate-50 justify-center items-center">
        <ActivityIndicator size="large" color="#007AFF" />
        <StyledText className="mt-4 text-base text-blue-500">
          طلب الإذن...
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
              تسجيل وإدارة ونشر محتواك
            </StyledText>
          </View>

          <RecordingControls
            isRecording={isRecording}
            isUploading={isUploading}
            onStart={startRecording}
            onStop={handleStopRecording}
          />

          <RecordingsList
            recordings={recordings}
            currentPlayingId={currentPlayingId}
            isPlayerPlaying={!!playerStatus?.playing}
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