// UPLOAD.tsx - With Progress Bar
import { View, Text, Pressable, ScrollView, TextInput, Image, Alert, Modal, FlatList, TouchableOpacity, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import { AntDesign, MaterialIcons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { Stack } from 'expo-router';
import { StyledText } from '@/components/StyledText';

interface AudioFile {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
}

interface UploadProgress {
  phase: 'image' | 'audio' | 'database' | 'complete';
  percentage: number;
  message: string;
}

const categories = [
  'كوميدي',
  'مال',
  'ترفيه',
  'تكنولوجيا',
  'علوم',
  'رياضة',
  'أخبار',
  'صحة',
  'Business',
  'تعليم',
  'فن',
  'تاريخ',
];

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const UploadScreen = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [audio, setAudio] = useState<AudioFile | null>(null);
  const [category, setCategory] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user: supaUser }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching current user:', error.message);
      } else {
        setCurrentUser(supaUser);
        // Pre-fill author field with user info
        if (supaUser) {
          setAuthor(supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || supaUser.email?.split('@')[0] || '');
        }
      }
    };
    fetchCurrentUser();
  }, []);

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'يرجى الموافقة على إذن الوصول إلى مكتبة الصور.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'فشل في اختيار الصورة. يرجى المحاولة مرة أخرى.');
    }
  };

  const pickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const audioFile = result.assets[0];
        setAudio({
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

  const removeImage = () => {
    setImage(null);
  };

  const removeAudio = () => {
    setAudio(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateForm = () => {
    if (!currentUser?.id) {
      Alert.alert('Authentication Error', 'يرجى تسجيل الدخول لتحميل المحتوى.');
      return false;
    }
    if (!title.trim()) {
      Alert.alert('Validation Error', 'يرجى إدخال عنوان المحتوى.');
      return false;
    }
    if (!author.trim()) {
      Alert.alert('Validation Error', 'يرجى إدخال اسم مبدع المحتوى.');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Validation Error', 'يرجى إدخال وصف المحتوى.');
      return false;
    }
    if (!category.trim()) {
      Alert.alert('Validation Error', 'يرجى إدخال فئة المحتوى.');
      return false;
    }
    if (!audio) {
      Alert.alert('Validation Error', 'يرجى اختيار ملف الصوت.');
      return false;
    }
    if (!image) {
      Alert.alert('Validation Error', 'يرجى اختيار صورة الغلاف.');
      return false;
    }
    return true;
  };

  // Helper function to convert base64 to ArrayBuffer for upload
  const base64ToArrayBuffer = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  // Helper function to simulate progress during file operations
  const simulateProgress = async (phase: 'image' | 'audio' | 'database', message: string, duration: number = 2000) => {
    const steps = 20;
    const stepDuration = duration / steps;
    
    for (let i = 0; i <= steps; i++) {
      const percentage = (i / steps) * 100;
      setUploadProgress({
        phase,
        percentage,
        message: `${message} (${Math.round(percentage)}%)`
      });
      
      if (i < steps) {
        await new Promise(resolve => setTimeout(resolve, stepDuration));
      }
    }
  };

  const handleUpload = async () => {
    if (!validateForm()) return;

    setIsUploading(true);
    let tempImagePath: string | null = null;
    let tempAudioPath: string | null = null;

    try {
      console.log('Starting atomic podcast upload...');

      // 1. Upload image to a temporary location
      if (image) {
        setUploadProgress({ phase: 'image', percentage: 0, message: 'Uploading cover image...' });
        const imageData = await FileSystem.readAsStringAsync(image, { encoding: FileSystem.EncodingType.Base64 });
        const imageFileName = `temp/${currentUser!.id}_${Date.now()}.jpg`;
        
        const { data: imageUploadData, error: imageUploadError } = await supabase.storage
          .from('podcasts')
          .upload(imageFileName, base64ToArrayBuffer(imageData), { contentType: 'image/jpeg' });

        if (imageUploadError) throw new Error(`Image upload failed: ${imageUploadError.message}`);
        
        tempImagePath = imageUploadData.path;
        console.log('Image uploaded to temp location:', tempImagePath);
        setUploadProgress({ phase: 'image', percentage: 100, message: 'Cover image uploaded!' });
      }

      // 2. Upload audio to a temporary location
      if (audio) {
        setUploadProgress({ phase: 'audio', percentage: 0, message: 'Uploading audio file...' });
        const audioData = await FileSystem.readAsStringAsync(audio.uri, { encoding: FileSystem.EncodingType.Base64 });
        const audioFileExtension = audio.name.split('.').pop() || 'mp3';
        const audioFileName = `temp/${currentUser!.id}_${Date.now()}.${audioFileExtension}`;

        const { data: audioUploadData, error: audioUploadError } = await supabase.storage
          .from('podcasts')
          .upload(audioFileName, base64ToArrayBuffer(audioData), { contentType: audio.mimeType || 'audio/mpeg' });

        if (audioUploadError) throw new Error(`Audio upload failed: ${audioUploadError.message}`);

        tempAudioPath = audioUploadData.path;
        console.log('Audio uploaded to temp location:', tempAudioPath);
        setUploadProgress({ phase: 'audio', percentage: 100, message: 'Audio file uploaded!' });
      }

      // 3. Invoke Edge Function to process and finalize the podcast
      setUploadProgress({ phase: 'database', percentage: 50, message: 'Finalizing podcast...' });
      console.log('Invoking create-podcast function...');

      const { data, error: functionError } = await supabase.functions.invoke('create-podcast', {
        body: {
          title,
          description,
          author,
          category,
          userId: currentUser!.id,
          tempImagePath,
          tempAudioPath,
          audioMimeType: audio?.mimeType,
        },
      });

      if (functionError) {
        throw new Error(`Failed to create podcast: ${functionError.message}`);
      }

      console.log('Podcast created successfully:', data);
      setUploadProgress({ phase: 'complete', percentage: 100, message: 'Podcast uploaded successfully!' });

      // 4. Success: Show alert and reset form
      setTimeout(() => {
        Alert.alert('Success!', 'Your podcast has been uploaded.', [
          {
            text: 'OK',
            onPress: () => {
              setTitle('');
              setAuthor(currentUser?.user_metadata?.full_name || '');
              setDescription('');
              setImage(null);
              setAudio(null);
              setCategory('');
              setUploadProgress(null);
            },
          },
        ]);
      }, 500);

    } catch (error: any) {
      console.error('Upload process failed:', error.message);
      Alert.alert('Upload Failed', error.message);

      // Cleanup: Attempt to remove temporary files if they were created
      const filesToRemove = [tempImagePath, tempAudioPath].filter(Boolean) as string[];
      if (filesToRemove.length > 0) {
        console.log('Cleaning up temporary files:', filesToRemove);
        const { error: cleanupError } = await supabase.storage.from('podcasts').remove(filesToRemove);
        if (cleanupError) {
          console.error('Failed to clean up temporary files:', cleanupError.message);
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

  const ProgressBar = ({ progress }: { progress: UploadProgress }) => {
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

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ 
        headerShown: true,
        headerTitle: "   ",
      }} />
      
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
          scrollEnabled={!isUploading} // Disable scroll during upload
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
        <View className="p-6 space-y-6">
          {/* Header */}
          <View className="items-center mb-4">
            <StyledText className="text-2xl font-semibold text-indigo-600">تحميل</StyledText>
            <StyledText className="text-gray-600 mt-1">شارك قصتك مع العالم</StyledText>
          </View>

          {/* Cover Image Picker */}
          <View className="items-center">
            <StyledText className="text-gray-700 font-semibold mb-2">الغلاف *</StyledText>
            <Pressable 
              onPress={pickImage}
              disabled={isUploading}
              className={`w-40 h-40 bg-white rounded-2xl items-center justify-center overflow-hidden border-2 border-separate border-indigo-400 shadow-sm ${
                isUploading ? 'opacity-50' : ''
              }`}
            >
              {image ? (
                <View className="relative w-full h-full">
                  <Image 
                    source={{ uri: image }} 
                    className="w-full h-full" 
                    resizeMode="cover"
                  />
                  <Pressable 
                    onPress={removeImage}
                    disabled={isUploading}
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full w-8 h-8 items-center justify-center"
                  >
                    <AntDesign name="close" size={16} color="white" />
                  </Pressable>
                </View>
              ) : (
                <View className="items-center p-4">
                  <MaterialIcons name="add-photo-alternate" size={36} color="#9CA3AF" />
                  <StyledText className="text-gray-500 text-center mt-2 font-medium ">إضافة صورة الغلاف</StyledText>
                  <StyledText className="text-gray-400 text-xs mt-1">اختياري</StyledText>
                </View>
              )}
            </Pressable>
          </View>

          {/* Audio File Picker */}
          <View>
            <StyledText className="text-gray-700 font-semibold mb-2 text-right">الملف الصوتي *</StyledText>
            <Pressable 
              onPress={pickAudio}
              disabled={isUploading}
              className={`bg-white p-6 rounded-2xl border-2 border-indigo-400 items-center shadow-sm ${
                isUploading ? 'opacity-50' : ''
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
                    disabled={isUploading}
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

          {/* Form Fields */}
          <View className="space-y-4">
            <View>
              <StyledText className="text-gray-700 font-semibold mb-2 text-right">
                العنوان *
              </StyledText>
              <TextInput
                className={`bg-white p-4 rounded-2xl text-base text-right border border-gray-200 shadow-sm ${
                  isUploading ? 'opacity-50' : ''
                }`}
                placeholder="أدخل العنوان"
                value={title}
                onChangeText={setTitle}
                editable={!isUploading}
              />
            </View>

            <View>
              <StyledText className="text-gray-700 font-semibold mb-2 text-right">
                المبدع *
              </StyledText>
              <TextInput
                className={`bg-white p-4 rounded-2xl text-base text-right border border-gray-200 shadow-sm ${
                  isUploading ? 'opacity-50' : ''
                }`}
                placeholder="أدخل اسم المبدع"
                value={author}
                onChangeText={setAuthor}
                editable={!isUploading}
              />
            </View>

            <View>
              <StyledText className="text-gray-700 font-semibold mb-2 text-right">
                الفئة *
              </StyledText>
              <Pressable
                onPress={() => setCategoryModalVisible(true)}
                disabled={isUploading}
                className={`bg-white p-4 rounded-2xl border border-gray-200 shadow-sm ${
                  isUploading ? 'opacity-50' : ''
                }`}
              >
                <StyledText className="text-base text-right">{category || 'اختر الفئة'}</StyledText>
              </Pressable>
            </View>

            <View>
              <StyledText className="text-gray-700 font-semibold mb-2 text-right">
                الوصف *
              </StyledText>
              <TextInput
                className={`bg-white p-4 rounded-2xl text-base text-right border border-gray-200 shadow-sm ${
                  isUploading ? 'opacity-50' : ''
                }`}
                placeholder="أدخل وصف البودكاست"
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
                maxLength={500}
                textAlignVertical="top"
                style={{ minHeight: 100 }}
                editable={!isUploading}
              />
            </View>
          </View>

          {/* Progress Bar - Show only during upload */}
          {isUploading && uploadProgress && (
            <ProgressBar progress={uploadProgress} />
          )}

          {/* Upload Button */}
          <Pressable 
            className={`p-4 rounded-2xl items-center mt-6 shadow-sm ${
              isUploading ? 'bg-gray-400' : 'bg-indigo-500'
            }`}
            onPress={handleUpload}
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

      {/* Category Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isCategoryModalVisible && !isUploading}
        onRequestClose={() => {
          setCategoryModalVisible(!isCategoryModalVisible);
        }}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-2xl p-6 w-4/5">
            <StyledText className="text-xl font-semibold text-gray-800 mb-4">اختر الفئة</StyledText>
            <FlatList
              data={categories}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setCategory(item);
                    setCategoryModalVisible(false);
                  }}
                  className="p-4 border-b border-gray-200"
                >
                  <StyledText className="text-base">{item}</StyledText>
                </TouchableOpacity>
              )}
            />
            <Pressable
              onPress={() => setCategoryModalVisible(false)}
              className="mt-4 bg-red-500 p-3 rounded-lg items-center"
            >
              <StyledText className="text-white font-semibold">إغلاق</StyledText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default UploadScreen;