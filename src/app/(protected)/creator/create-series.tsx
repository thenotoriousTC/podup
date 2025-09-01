import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, ScrollView, SafeAreaView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { StyledText } from '@/components/StyledText';

const CreateSeriesScreen = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      // Validate file size
      const response = await fetch(imageUri);
      const blob = await response.blob();
      if (blob.size > 2 * 1024 * 1024) {
        Alert.alert('خطأ', 'حجم الصورة يتجاوز 2 ميجابايت.');
        return;
      }
      setImage(imageUri);
    }
  };

  const uploadImage = async (uri: string) => {
    if (!user) throw new Error('User not authenticated');
    
    let arraybuffer: ArrayBuffer;
    try {
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }
      arraybuffer = await response.arrayBuffer();
    } catch (error) {
      throw new Error('Failed to process image: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
    
    const fileExt = uri.split('.').pop()?.toLowerCase() ?? 'jpeg';
    const path = `${user.id}/${new Date().getTime()}.${fileExt}`;
    const { data, error } = await supabase.storage
      .from('series.cover.arts')
      .upload(path, arraybuffer, {
        contentType: `image/${fileExt}`,
      });

    if (error) {
      throw error;
    }

    return data.path;
  };

  const handleCreateSeries = async () => {
    if (!title.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال عنوان للسلسلة.');
      return;
    }
    if (!image) {
      Alert.alert('خطأ', 'الرجاء اختيار صورة غلاف للسلسلة.');
      return;
    }

    setIsSubmitting(true);
    try {
      const imagePath = await uploadImage(image);
      const { data: imageUrlData } = supabase.storage.from('series.cover.arts').getPublicUrl(imagePath);

      const { data: newSeries, error } = await supabase
        .from('series')
        .insert({
          title,
          description,
          cover_art_url: imageUrlData.publicUrl,
          creator_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert('نجاح', 'تم إنشاء السلسلة بنجاح!');
      // Navigate to the next step: adding episodes
      router.push(`/creator/manage-series-episodes/${newSeries.id}`);

    } catch (error: any) {
      console.error('Error creating series:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إنشاء السلسلة. الرجاء المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen 
        options={{ 
          title: '',
          headerShown: true,
          headerBackVisible: true,
        }} 
      />
      <ScrollView className="flex-1 p-4 pt-6">
        <StyledText className="text-base font-semibold mb-2 text-right">صورة الغلاف</StyledText>
      <TouchableOpacity className="w-full h-48 bg-gray-100 justify-center items-center rounded-lg mb-4 overflow-hidden" onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} className=" relative w-full h-full" />
        ) : (
          <View className="justify-center items-center pt-12">
            <Ionicons name="camera" size={40} color="#ccc" />
            <StyledText className="text-gray-500 mt-12">اختر صورة</StyledText>
            <StyledText className="text-gray-500 text-xs mt-1 mb-8">(الحجم الأقصى 2 ميجابايت)</StyledText>
          </View>
        )}
      </TouchableOpacity>

      <StyledText className="text-base font-semibold mb-2 text-right">عنوان السلسلة</StyledText>
      <TextInput
        className="bg-gray-100 p-3 rounded-lg mb-4 text-base text-right text-black"
        value={title}
        onChangeText={setTitle}
        placeholder="عنوان"
        placeholderTextColor="#999"
      />

      <StyledText className="text-base font-semibold mb-2 text-right">الوصف</StyledText>
      <TextInput
        className="bg-gray-100 p-3 rounded-lg mb-4 text-base text-right h-32 text-black"
        style={{ textAlignVertical: 'top' }}
        value={description}
        onChangeText={setDescription}
        placeholder="وصف قصير عن محتوى السلسلة..."
        placeholderTextColor="#999"
        multiline
      />

      <TouchableOpacity 
        className={`p-4 rounded-lg items-center mt-4 ${isSubmitting ? 'bg-gray-400' : 'bg-blue-500'}`} 
        onPress={handleCreateSeries} 
        disabled={isSubmitting}
      >
        <StyledText className="text-white text-lg font-semibold">{isSubmitting ? 'جاري الإنشاء...' : 'إنشاء السلسلة'}</StyledText>
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateSeriesScreen;