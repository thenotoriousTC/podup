import React from 'react';
import { View, Pressable, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { StyledText } from '@/components/StyledText';

interface ImagePickerProps {
  image: string | null;
  onSetImage: (uri: string | null) => void;
  disabled: boolean;
}

const ImagePickerComponent: React.FC<ImagePickerProps> = ({ image, onSetImage, disabled }) => {

  const pickImage = async () => {
    try {
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
        onSetImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'فشل في اختيار الصورة. يرجى المحاولة مرة أخرى.');
    }
  };

  const removeImage = () => {
    onSetImage(null);
  };

  return (
    <View className="items-center">
      <StyledText className="text-gray-700 font-semibold mb-2">الغلاف *</StyledText>
      <Pressable 
        onPress={pickImage}
        disabled={disabled}
        className={`w-40 h-40 bg-white rounded-2xl items-center justify-center overflow-hidden border-2 border-separate border-indigo-400 shadow-sm ${
          disabled ? 'opacity-50' : ''
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
              disabled={disabled}
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
  );
};

export default ImagePickerComponent;
