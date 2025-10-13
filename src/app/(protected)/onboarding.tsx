import { Pressable } from '@/components/Pressable';
import { View, Text, ScrollView, TextInput, Image, Alert, ActivityIndicator } from 'react-native';;
import { TouchableOpacity } from '@/components/TouchableOpacity';
import React, { useState, useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { MaterialIcons } from '@expo/vector-icons';
import { StyledText } from '@/components/StyledText';

// Re-using categories from UPLOAD.tsx
const categories = [
  'كوميدي', 'مال', 'ترفيه', 'تكنولوجيا', 'علوم', 'رياضة',
  'أخبار', 'صحة', 'Business', 'تعليم', 'فن', 'تاريخ',
];

const OnboardingScreen = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState('');
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        setFullName(user.user_metadata?.full_name || '');
      }
    };
    fetchUser();
  }, []);

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

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
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
    if (selectedInterests.length === 0) {
      Alert.alert('الاهتمامات مطلوبة', 'يرجى اختيار اهتمام واحد على الأقل.');
      return;
    }
    if (!currentUser) {
        Alert.alert('خطأ', 'لا يمكن تحديد المستخدم. يرجى المحاولة مرة أخرى.');
        return;
    }

    setIsSaving(true);
    let avatarUrl: string | undefined = undefined;

    try {
      // 1. Upload avatar if a new one is picked
      if (avatarImage) {
        const imageData = await FileSystem.readAsStringAsync(avatarImage, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const imageFileName = `avatar_${currentUser.id}_${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(imageFileName, base64ToArrayBuffer(imageData), {
            contentType: 'image/jpeg',
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(imageFileName);
        avatarUrl = urlData.publicUrl;
      }

      // 2. Update the user's profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          interests: selectedInterests,
          ...(avatarUrl && { avatar_url: avatarUrl }),
        })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      Alert.alert('تم حفظ الملف الشخصي!', 'تم تحديث الملف الشخصي بنجاح.');
      router.replace('/'); // Navigate to home screen

    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('فشل الحفظ', error.message || 'حدث خطأ غير متوقع.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: 'Set Up Your Profile' }} />
      
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="items-center mb-8">
          <StyledText className="text-3xl font-semibold text-indigo-600 mb-1">مرحبا!</StyledText>
          <StyledText className="text-base text-gray-600">دعنا نقوم بوضع ملفك الشخصي.</StyledText>
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
                className="w-40 h-40 rounded-full bg-white" 
              />
            ) : (
              <View className="w-40 h-40 rounded-full bg-indigo-600 justify-center items-center">
                <MaterialIcons name="add-a-photo" size={40} color="white" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Full Name Section */}
        <View className="mb-6">
          <StyledText className="text-lg font-semibold text-gray-700 mb-3 text-right">الاسم الكامل</StyledText>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="أدخل اسمك الكامل"
            className="bg-white p-4 rounded-lg text-base border border-gray-300"
            editable={!isSaving}
          />
        </View>

        {/* Interests Section */}
        <View className="mb-6">
          <StyledText className="text-lg font-semibold text-gray-700 mb-3 text-right">الاهتمامات</StyledText>
          <StyledText className="text-sm text-gray-500 mb-4 text-right">اختر بعض المواضيع التي تهتم بها.</StyledText>
          <View className="flex-row flex-wrap gap-2">
            {categories.map(interest => (
              <TouchableOpacity
                key={interest}
                className={`py-2 px-4 rounded-full border ${
                  selectedInterests.includes(interest) 
                    ? 'bg-indigo-600 border-indigo-600' 
                    : 'bg-white border-gray-300'
                }`}
                onPress={() => toggleInterest(interest)}
                disabled={isSaving}
              >
                <StyledText className={
                  selectedInterests.includes(interest) 
                    ? 'text-white' 
                    : 'text-gray-700'
                }>
                  {interest}
                </StyledText>
              </TouchableOpacity>
            ))}
          </View>
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
            <StyledText className="text-white text-base font-semibold">حفظ و استمرار</StyledText>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OnboardingScreen;