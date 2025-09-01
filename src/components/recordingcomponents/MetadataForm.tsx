import React from 'react';
import { View, TextInput, TouchableOpacity, Image, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { StyledText } from '@/components/StyledText';

interface MetadataFormProps {
  podcastTitle: string;
  setPodcastTitle: (title: string) => void;
  podcastDescription: string;
  setPodcastDescription: (description: string) => void;
  podcastImage: string | null;
  setPodcastImage: (image: string | null) => void;
  category: string;
  onCategoryPress: () => void;
  isUploading: boolean;
  onPublish: () => void;
  onCancel: () => void;
}

const MetadataForm: React.FC<MetadataFormProps> = ({ 
  podcastTitle, setPodcastTitle, 
  podcastDescription, setPodcastDescription, 
  podcastImage, setPodcastImage, 
  category, onCategoryPress, 
  isUploading, onPublish, onCancel 
}) => {

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setPodcastImage(result.assets[0].uri);
    }
  };

  const isFormValid = podcastTitle.trim() && podcastDescription.trim() && podcastImage && category;

  return (
    <View className="bg-white rounded-2xl p-5 mb-6 shadow-lg">
      <StyledText className="text-3xl font-semibold text-indigo-500 text-center mb-12 ">
        نشر محتوى
      </StyledText>
      <StyledText className="text-base text-gray-600 text-center mb-6">
        أضف التفاصيل حول محتواك
      </StyledText>
      
      <View className="mb-5">
        <StyledText className="text-base font-semibold text-gray-800 mb-2 text-right">
          صورة الغلاف *
        </StyledText>
        <TouchableOpacity
          className="border-2 border-separate border-indigo-400 rounded-xl p-6 items-center justify-center bg-white"
          onPress={pickImage}
          disabled={isUploading}
        >
          {podcastImage ? (
            <Image
              source={{ uri: podcastImage }}
              className="w-24 h-24 rounded-lg mb-2"
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="image" size={48} color="#4F46E5" />
          )}
          <StyledText className="text-base font-medium text-indigo-500 mt-2">
            {podcastImage ? "تغيير صورة الغلاف" : "اختيار صورة الغلاف"}
          </StyledText>
        </TouchableOpacity>
      </View>
      
      <View className="mb-5">
        <StyledText className="text-base font-semibold text-gray-800 mb-2 text-right">
          عنوان المحتوى *
        </StyledText>
        <TextInput
          className="rounded-lg p-3 text-base bg-gray-50 text-gray-800 text-right"
          value={podcastTitle}
          onChangeText={setPodcastTitle}
          placeholder="عنوان المحتوى..."
          placeholderTextColor="#9CA3AF"
          editable={!isUploading}
        />
      </View>
      
      <View className="mb-5">
        <StyledText className="text-base font-semibold text-gray-800 mb-2 text-right">
          الفئة *
        </StyledText>
        <Pressable
          onPress={onCategoryPress}
          disabled={isUploading}
          className={`bg-gray-50 p-3 rounded-lg shadow-sm ${
            isUploading ? 'opacity-50' : ''
          }`}
        >
          <StyledText className="text-base text-gray-800 text-right">{category || 'اختر الفئة'}</StyledText>
        </Pressable>
      </View>
      
      <View className="mb-5">
        <StyledText className="text-base font-semibold text-gray-800 mb-2 text-right">
          وصف *
        </StyledText>
        <TextInput
          className="rounded-lg p-3 text-base bg-gray-50 text-gray-800 min-h-[100px] text-right"
          value={podcastDescription}
          onChangeText={setPodcastDescription}
          placeholder="وصف المحتوى..."
          placeholderTextColor="#9CA3AF"
          multiline={true}
          editable={!isUploading}
          textAlignVertical="top"
        />
      </View>
      
      <View className="flex-row justify-between items-center">
        <TouchableOpacity 
          className={`flex-row items-center py-3 px-4 rounded-lg bg-gray-100 ${isUploading ? 'opacity-50' : ''}`}
          onPress={onCancel}
          disabled={isUploading}
        >
          <Ionicons name="arrow-back" size={20} color="#007AFF" />
          <StyledText className="ml-2 text-base font-semibold text-blue-500">
            إلغاء
          </StyledText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className={`flex-1 ml-3 py-3 px-5 rounded-lg flex-row items-center justify-center ${!isFormValid || isUploading ? 'bg-gray-400' : 'bg-green-500'}`}
          onPress={onPublish}
          disabled={!isFormValid || isUploading}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="cloud-upload" size={24} color="#FFFFFF" />
          )}
          <StyledText className="text-white text-base font-semibold ml-2">
            {isUploading ? "نشر ..." : "نشر المحتوى"}
          </StyledText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MetadataForm;
