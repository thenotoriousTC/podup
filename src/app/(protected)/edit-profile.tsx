import { View, Text, Pressable, ScrollView, TextInput, Image, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { MaterialIcons } from '@expo/vector-icons';
import { StyledText } from '@/components/StyledText';
import { useAuth } from '@/providers/AuthProvider';

const EditProfileScreen = () => {
  const auth = useAuth();
  const currentUser = auth?.user;
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      } else if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
        setAvatarImage(data.avatar_url || null);
      }
      setLoading(false);
    };
    
    fetchProfile();
  }, [currentUser]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('نحتاج إلى الإذن', 'يرجى الموافقة على إذن الوصول إلى مكتبة الصور.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatarImage(result.assets[0].uri);
    }
  };

  const base64ToArrayBuffer = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('الاسم الكامل مطلوب', 'يرجى إدخال اسمك الكامل.');
      return;
    }
    if (!currentUser) {
      Alert.alert('خطأ', 'لا يمكن تحديد المستخدم. يرجى المحاولة مرة أخرى.');
      return;
    }

    setIsSaving(true);
    let avatarUrl: string | undefined = undefined;

    try {
      // Check if we have a new image to upload
      const isNewImage = avatarImage && !avatarImage.startsWith('http');
      
      if (isNewImage) {
        // Call edge function to handle old image deletion and new upload
        if (!avatarImage) {
         throw new Error('No avatar image provided');
        }
        const imageData = await FileSystem.readAsStringAsync(avatarImage!, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        const { data, error } = await supabase.functions.invoke('update-profile-image', {
          body: {
            userId: currentUser.id,
            imageData: imageData,
            oldAvatarUrl: profile?.avatar_url
          }
        });

        if (error) throw error;
        avatarUrl = data.avatarUrl;
      }

      // Update the user's profile
      const updateData: any = {
        full_name: fullName.trim(),
      };
      
      if (avatarUrl) {
        updateData.avatar_url = avatarUrl;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      Alert.alert('تم تحديث الملف الشخصي!', 'تم تحديث الملف الشخصي بنجاح.', [
        { text: 'موافق', onPress: () => router.back() }
      ]);

    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      Alert.alert('فشل التحديث', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#4F46E5" />
        <StyledText className="text-lg text-gray-600 mt-4">جاري التحميل...</StyledText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ 
        title: 'تعديل الملف الشخصي',
        headerTitleAlign: 'center'
      }} />
      
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="items-center mb-8">
          <StyledText className="text-3xl font-semibold text-indigo-600 mb-1">تعديل الملف الشخصي</StyledText>
          <StyledText className="text-base text-gray-600">قم بتحديث صورتك واسمك.</StyledText>
        </View>

        {/* Avatar Section */}
        <View className="mb-6">
          <StyledText className="text-lg font-semibold text-gray-700 mb-3 text-right">صورة الملف الشخصي</StyledText>
          <TouchableOpacity 
            onPress={pickImage} 
            className="self-center" 
            disabled={isSaving}
          >
            {avatarImage ? (
              <Image 
                source={{ uri: avatarImage }} 
                className="w-32 h-32 rounded-full bg-white border-4 border-indigo-200" 
              />
            ) : (
              <View className="w-32 h-32 rounded-full bg-indigo-600 justify-center items-center border-4 border-indigo-200">
                <MaterialIcons name="add-a-photo" size={40} color="white" />
              </View>
            )}
            <View className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-2">
              <MaterialIcons name="edit" size={20} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Full Name Section */}
        <View className="mb-6">
          <StyledText className="text-lg font-semibold text-gray-700 mb-3 text-right">الاسم الكامل</StyledText>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="أدخل اسمك الكامل"
            className="bg-white p-4 rounded-lg text-base border border-gray-300 text-right"
            editable={!isSaving}
            textAlign="right"
          />
        </View>

        {/* Save Button */}
        <Pressable 
          onPress={handleSave} 
          className={`p-4 rounded-lg items-center mt-5 ${
            isSaving ? 'bg-indigo-300' : 'bg-indigo-600'
          }`} 
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />  
          ) : (
            <StyledText className="text-white text-base font-semibold">حفظ التغييرات</StyledText>
          )}
        </Pressable>

        {/* Cancel Button */}
        <Pressable 
          onPress={() => router.back()} 
          className="p-4 rounded-lg items-center mt-3 bg-gray-200" 
          disabled={isSaving}
        >
          <StyledText className="text-gray-700 text-base font-semibold">إلغاء</StyledText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;
