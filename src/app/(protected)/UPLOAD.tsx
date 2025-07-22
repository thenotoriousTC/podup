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
    
    try {
      console.log('Starting podcast upload...');
      
      // Upload image first
      let imageUrl = null;
      if (image) {
        console.log('Uploading image...');
        setUploadProgress({
          phase: 'image',
          percentage: 0,
          message: 'جاري تحميل صورة الغلاف...'
        });
        
        const imageData = await FileSystem.readAsStringAsync(image, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        // Simulate progress for image upload
        await simulateProgress('image', 'تحميل صورة الغلاف', 1500);
        
        const imageFileName = `podcast_image_${currentUser!.id}_${Date.now()}.jpg`;
        
        // Upload image to storage
        const { data: imageUploadData, error: imageUploadError } = await supabase.storage
          .from('podcasts')
          .upload(imageFileName, base64ToArrayBuffer(imageData), {
            contentType: 'image/jpeg',
          });
        
        if (imageUploadError) {
          console.error('Image upload error:', imageUploadError);
          throw imageUploadError;
        }
        
        // Get public URL for image
        const { data: imageUrlData } = supabase.storage
          .from('podcasts')
          .getPublicUrl(imageFileName);
        
        imageUrl = imageUrlData.publicUrl;
        console.log('Image uploaded successfully:', imageUrl);
        
        setUploadProgress({
          phase: 'image',
          percentage: 100,
          message: 'تم تحميل صورة الغلاف بنجاح!'
        });
      }
      
      // Upload audio file
      if (audio) {
        console.log('Uploading audio...');
        setUploadProgress({
          phase: 'audio',
          percentage: 0,
          message: 'جاري تحميل الملف الصوتي...'
        });
        
        const audioData = await FileSystem.readAsStringAsync(audio.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        // Simulate progress for audio upload (longer duration for larger files)
        const audioUploadDuration = audio.size && audio.size > 10000000 ? 4000 : 2500; // 4s for large files, 2.5s for smaller
        await simulateProgress('audio', 'تحميل الملف الصوتي', audioUploadDuration);
        
        const audioFileExtension = audio.name.split('.').pop() || 'm4a';
        const audioFileName = `podcast_${currentUser!.id}_${Date.now()}.${audioFileExtension}`;
        
        // Upload audio to Supabase Storage
        const { data: audioUploadData, error: audioUploadError } = await supabase.storage
          .from('podcasts')
          .upload(audioFileName, base64ToArrayBuffer(audioData), {
            contentType: audio.mimeType || 'audio/mpeg',
          });
        
        if (audioUploadError) {
          console.error('Audio upload error:', audioUploadError);
          throw audioUploadError;
        }
        
        // Get public URL for audio
        const { data: audioUrlData } = supabase.storage
          .from('podcasts')
          .getPublicUrl(audioFileName);
        
        const audioUrl = audioUrlData.publicUrl;
        console.log('Audio uploaded successfully:', audioUrl);
        
        setUploadProgress({
          phase: 'audio',
          percentage: 100,
          message: 'تم تحميل الملف الصوتي بنجاح!'
        });
        
        // Save to database
        console.log('Saving to database...');
        setUploadProgress({
          phase: 'database',
          percentage: 0,
          message: 'جاري حفظ البيانات...'
        });
        
        // Simulate database save progress
        await simulateProgress('database', 'حفظ بيانات البودكاست', 1000);
        
        const { data: dbData, error: dbError } = await supabase.from('podcasts').insert({
          user_id: currentUser!.id, // Ensure user_id is included
          title,
          author,
          description,
          category,
          image_url: imageUrl,
          audio_url: audioUrl,
          thumbnail_url: imageUrl, // Using the same for simplicity
        }).select().single();
        
        if (dbError) {
          console.error('Database error:', dbError);
          throw dbError;
        }
        
        console.log('Podcast saved to database successfully');
        
        setUploadProgress({
          phase: 'complete',
          percentage: 100,
          message: 'تم تحميل البودكاست بنجاح!'
        });
        
        // Show success message after a short delay
        setTimeout(() => {
          Alert.alert(
            'Success!', 
            'Your podcast has been uploaded successfully and is now available for others to listen to!', 
            [
              {
                text: 'OK',
                onPress: () => {
                  // Reset form and progress
                  setTitle('');
                  setAuthor(currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name || currentUser?.email?.split('@')[0] || '');
                  setDescription('');
                  setImage(null);
                  setAudio(null);
                  setCategory('');
                  setUploadProgress(null);
                }
              }
            ]
          );
        }, 100);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(null);
      Alert.alert('Upload Failed', `There was an error uploading your podcast: ${error || 'Unknown error'}`);
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
            <Text className="text-lg font-semibold text-gray-800 ml-2">
              {progress.message}
            </Text>
          </View>
          
          <View className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <View 
              className={`h-full rounded-full transition-all duration-300 ${
                progress.percentage === 100 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: progressWidth }}
            />
          </View>
          
          <Text className="text-sm text-gray-600 mt-2">
            {Math.round(progress.percentage)}% مكتمل
          </Text>
        </View>
        
        {progress.phase !== 'complete' && (
          <View className="flex-row items-center justify-center">
            <MaterialIcons name="hourglass-empty" size={16} color="#9CA3AF" />
            <Text className="text-sm text-gray-500 ml-1">
              يرجى عدم إغلاق التطبيق أثناء التحميل
            </Text>
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
            <Text className="text-2xl font-bold text-gray-800">تحميل</Text>
            <Text className="text-gray-600 mt-1">شارك قصةك مع العالم</Text>
          </View>

          {/* Cover Image Picker */}
          <View className="items-center">
            <Text className="text-gray-700 font-semibold mb-2">الغلاف *</Text>
            <Pressable 
              onPress={pickImage}
              disabled={isUploading}
              className={`w-40 h-40 bg-white rounded-2xl items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 shadow-sm ${
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
                  <Text className="text-gray-500 text-center mt-2 font-medium">إضافة صورة الغلاف</Text>
                  <Text className="text-gray-400 text-xs mt-1">اختياري</Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Audio File Picker */}
          <View>
            <Text className="text-gray-700 font-semibold mb-2">الملف الصوتي *</Text>
            <Pressable 
              onPress={pickAudio}
              disabled={isUploading}
              className={`bg-white p-6 rounded-2xl border-2 border-dashed border-gray-200 items-center shadow-sm ${
                isUploading ? 'opacity-50' : ''
              }`}
            >
              {audio ? (
                <View className="items-center w-full">
                  <View className="bg-blue-100 rounded-full p-3 mb-3">
                    <Feather name="music" size={24} color="#3B82F6" />
                  </View>
                  <Text className="text-lg font-semibold text-gray-800 text-center" numberOfLines={1}>
                    {audio.name}    
                  </Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    {audio.size ? formatFileSize(audio.size) : 'حجم غير معروف'}
                  </Text>
                  <Pressable 
                    onPress={removeAudio}
                    disabled={isUploading}
                    className="mt-3 bg-red-100 px-3 py-1 rounded-full"
                  >
                    <Text className="text-red-600 text-sm">حذف</Text>
                  </Pressable>
                </View>
              ) : (
                <View className="items-center">
                  <Feather name="upload-cloud" size={32} color="#9CA3AF" />
                  <Text className="text-lg font-semibold text-gray-800 mt-2">
                    اختر ملف الصوت
                  </Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    MP3, WAV, AAC, M4A, الخ....  
                  </Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Form Fields */}
          <View className="space-y-4">
            <View>
              <Text className="text-gray-700 font-semibold mb-2">
                العنوان *
              </Text>
              <TextInput
                className={`bg-white p-4 rounded-2xl text-base border border-gray-200 shadow-sm ${
                  isUploading ? 'opacity-50' : ''
                }`}
                placeholder="أدخل العنوان"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
                editable={!isUploading}
              />
            </View>

            <View>
              <Text className="text-gray-700 font-semibold mb-2">
                المُنشئ *
              </Text>
              <TextInput
                className={`bg-white p-4 rounded-2xl text-base border border-gray-200 shadow-sm ${
                  isUploading ? 'opacity-50' : ''
                }`}
                placeholder="أدخل اسم المُنشئ"
                value={author}
                onChangeText={setAuthor}
                maxLength={50}
                editable={!isUploading}
              />
            </View>

            <View>
              <Text className="text-gray-700 font-semibold mb-2">
                الفئة *
              </Text>
              <Pressable
                onPress={() => setCategoryModalVisible(true)}
                disabled={isUploading}
                className={`bg-white p-4 rounded-2xl border border-gray-200 shadow-sm ${
                  isUploading ? 'opacity-50' : ''
                }`}
              >
                <Text className="text-base">{category || 'اختر الفئة'}</Text>
              </Pressable>
            </View>

            <View>
              <Text className="text-gray-700 font-semibold mb-2">
                الوصف *
              </Text>
              <TextInput
                className={`bg-white p-4 rounded-2xl text-base border border-gray-200 shadow-sm ${
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
              isUploading ? 'bg-gray-400' : 'bg-blue-500'
            }`}
            onPress={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? (
              <View className="flex-row items-center">
                <MaterialIcons name="hourglass-empty" size={20} color="white" />
                <Text className="text-white font-semibold text-lg ml-2">جاري التحميل...</Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Feather name="upload" size={20} color="white" />
                <Text className="text-white font-semibold text-lg ml-2">تحميل</Text>
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
            <Text className="text-xl font-bold text-gray-800 mb-4">اختر الفئة</Text>
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
                  <Text className="text-base">{item}</Text>
                </TouchableOpacity>
              )}
            />
            <Pressable
              onPress={() => setCategoryModalVisible(false)}
              className="mt-4 bg-red-500 p-3 rounded-lg items-center"
            >
              <Text className="text-white font-semibold">إغلاق</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default UploadScreen;