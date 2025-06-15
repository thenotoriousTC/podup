// UPLOAD.tsx - Fixed version
import { View, Text, Pressable, ScrollView, TextInput, Image, Alert } from 'react-native';
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

const UploadScreen = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [audio, setAudio] = useState<AudioFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
        Alert.alert('Permission needed', 'Please grant permission to access your photo library.');
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
      Alert.alert('Error', 'Failed to pick image. Please try again.');
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
      Alert.alert('Error', 'Failed to pick audio file. Please try again.');
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
      Alert.alert('Authentication Error', 'Please log in to upload a podcast.');
      return false;
    }
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a podcast title.');
      return false;
    }
    if (!author.trim()) {
      Alert.alert('Validation Error', 'Please enter a Podcast Creator name.');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please enter a podcast description.');
      return false;
    }
    if (!audio) {
      Alert.alert('Validation Error', 'Please select an audio file.');
      return false;
    }
    if (!image) {
      Alert.alert('Validation Error', 'Please select a cover image.');
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

  const handleUpload = async () => {
    if (!validateForm()) return;

    setIsUploading(true);
    
    try {
      console.log('Starting podcast upload...');
      
      // Upload image first
      let imageUrl = null;
      if (image) {
        console.log('Uploading image...');
        const imageData = await FileSystem.readAsStringAsync(image, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
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
      }
      
      // Upload audio file
      if (audio) {
        console.log('Uploading audio...');
        const audioData = await FileSystem.readAsStringAsync(audio.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
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
        
        console.log('Audio uploaded successfully:', audioUrlData.publicUrl);
        
        // Save to podcasts table - FIXED: Using both image_url and thumbnail_url
        console.log('Saving to database...');
        const { error: dbError } = await supabase
          .from('podcasts')
          .insert({
            title: title.trim(),
            description: description.trim(),
            author: author.trim(),
            audio_url: audioUrlData.publicUrl,
            image_url: imageUrl, // For new uploads
            thumbnail_url: imageUrl, // For compatibility with existing seeded data
            duration: 0, // You might want to calculate actual duration
            created_at: new Date().toISOString(),
          });
        
        if (dbError) {
          console.error('Database error:', dbError);
          throw dbError;
        }
        
        console.log('Podcast saved to database successfully');
        
        Alert.alert(
          'Success!', 
          'Your podcast has been uploaded successfully and is now available for others to listen to!', 
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setTitle('');
                setAuthor(currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name || currentUser?.email?.split('@')[0] || '');
                setDescription('');
                setImage(null);
                setAudio(null);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', `There was an error uploading your podcast: ${error || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
     <Stack.Screen options={{ headerShown: true,
     headerTitle: "   ",


      }} />
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="p-6 space-y-6">
          {/* Header */}
          <View className="items-center mb-4">
            <Text className="text-2xl font-bold text-gray-800">  تحميل  </Text>
            <Text className="text-gray-600 mt-1">شارك قصةك مع العالم</Text>
          </View>

          {/* Cover Image Picker */}
          <View className="items-center">
            <Text className="text-gray-700 font-semibold mb-2">الغلاف *</Text>
            <Pressable 
              onPress={pickImage}
              className="w-40 h-40 bg-white rounded-2xl items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 shadow-sm"
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
              className="bg-white p-6 rounded-2xl border-2 border-dashed border-gray-200 items-center shadow-sm"
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
                className="bg-white p-4 rounded-2xl text-base border border-gray-200 shadow-sm"
                placeholder="أدخل العنوان"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
            </View>

            <View>
              <Text className="text-gray-700 font-semibold mb-2">
                المُنشئ *
              </Text>
              <TextInput
                className="bg-white p-4 rounded-2xl text-base border border-gray-200 shadow-sm"
                placeholder="أدخل اسم المُنشئ"
                value={author}
                onChangeText={setAuthor}
                maxLength={50}
              />
            </View>

            <View>
              <Text className="text-gray-700 font-semibold mb-2">
                  الوصف *
              </Text>
              <TextInput
                className="bg-white p-4 rounded-2xl text-base border border-gray-200 shadow-sm"
                placeholder="أدخل وصف البودكاست"
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
                maxLength={500}
                textAlignVertical="top"
                style={{ minHeight: 100 }}
              />
            </View>
          </View>

          {/* Upload Button */}
          <Pressable 
            className={`p-4 rounded-2xl items-center mt-6 shadow-sm ${
              isUploading ? 'bg-gray-400' : 'bg-blue-500'
            }`}
            onPress={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? (
              <Text className="text-white font-semibold text-lg">جاري التحميل...  </Text>
            ) : (
              <View className="flex-row items-center">
                <Feather name="upload" size={20} color="white" />
                <Text className="text-white font-semibold text-lg ml-2">  تحميل</Text>
              </View>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

export default UploadScreen;
