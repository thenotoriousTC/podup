import { useState } from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { AudioFile, UploadProgress } from './types';
import { useRouter } from 'expo-router';

interface UsePodcastUploadProps {
  currentUser: User | null;
  title: string;
  author: string;
  description: string;
  category: string;
  image: string | null;
  audio: AudioFile | null;
  onUploadComplete: () => void;
}

export const usePodcastUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const router = useRouter();

  const validateForm = (props: Omit<UsePodcastUploadProps, 'onUploadComplete'>) => {
    if (!props.currentUser?.id) {
      Alert.alert('خطأ في التحقق من الهوية', 'يرجى تسجيل الدخول لتحميل المحتوى.');
      return false;
    }
    if (!props.title.trim()) {
      Alert.alert('خطأ في التحقق من البيانات', 'يرجى إدخال عنوان المحتوى.');
      return false;
    }
    if (!props.author.trim()) {
      Alert.alert('خطأ في التحقق من البيانات', 'يرجى إدخال اسم مبدع المحتوى.');
      return false;
    }
    if (!props.description.trim()) {
      Alert.alert('خطأ في التحقق من البيانات', 'يرجى إدخال وصف المحتوى.');
      return false;
    }
    if (!props.category.trim()) {
      Alert.alert('خطأ في التحقق من البيانات', 'يرجى إدخال فئة المحتوى.');
      return false;
    }
    if (!props.audio) {
      Alert.alert('خطأ في التحقق من البيانات', 'يرجى اختيار ملف الصوت.');
      return false;
    }
    if (!props.image) {
      Alert.alert('خطأ في التحقق من البيانات', 'يرجى اختيار صورة الغلاف.');
      return false;
    }
    return true;
  };

  /**
   * Uploads a file to R2 via secure Edge Function
   */
  const uploadFileViaEdgeFunction = async (
    fileUri: string,
    fileName: string,
    fileType: 'audio' | 'image',
    mimeType: string
  ): Promise<string> => {
    // Get auth token first
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }

    // Create FormData with file
    // In React Native, FormData can accept an object with uri, type, and name
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      type: mimeType,
      name: fileName,
    } as any);
    formData.append('fileType', fileType);
    formData.append('filename', fileName);

    // Call Edge Function using fetch (supabase.functions.invoke doesn't handle FormData well in RN)
    const functionUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/upload-to-r2`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: formData,
    });

    // Get response text first to handle empty responses
    const responseText = await response.text();
    console.log('📥 Response status:', response.status);
    console.log('📥 Response text:', responseText.substring(0, 200));

    if (!responseText) {
      throw new Error('Empty response from server');
    }

    // Try to parse JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error('❌ JSON parse error:', error);
      console.error('Response text:', responseText);
      throw new Error(`Server returned invalid response: ${responseText.substring(0, 100)}`);
    }

    if (!response.ok) {
      throw new Error(data?.error || `Upload failed with status ${response.status}`);
    }

    if (!data?.success || !data?.url) {
      throw new Error(data?.error || 'Upload failed');
    }

    console.log('✅ Upload successful:', data.url);
    return data.url;
  };

  const handleUpload = async (props: UsePodcastUploadProps) => {
    if (!validateForm(props)) return;

    setIsUploading(true);
    setUploadProgress(null);
    let imagePublicUrl: string | null = null;
    let audioPublicUrl: string | null = null;

    try {
      // Upload image via Edge Function
      if (props.image) {
        setUploadProgress({ phase: 'image', percentage: 0, message: 'جاري تحميل صورة الغلاف...' });
        const imageInfo = await FileSystem.getInfoAsync(props.image);
        const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
        if (imageInfo.exists && 'size' in imageInfo && imageInfo.size > MAX_IMAGE_SIZE) {
          throw new Error('حجم الصورة كبير جداً. الحد الأقصى 10 ميجابايت');
        }

        const imageFileName = `${props.currentUser!.id}_${Date.now()}.jpg`;
        setUploadProgress({ phase: 'image', percentage: 50, message: 'جاري تحميل صورة الغلاف...' });
        
        imagePublicUrl = await uploadFileViaEdgeFunction(
          props.image,
          imageFileName,
          'image',
          'image/jpeg'
        );

        setUploadProgress({ phase: 'image', percentage: 100, message: 'تم تحميل صورة الغلاف!' });
      }

      // Upload audio via Edge Function
      if (props.audio) {
        setUploadProgress({ phase: 'audio', percentage: 0, message: 'جاري تحميل ملف الصوت...' });
        const audioInfo = await FileSystem.getInfoAsync(props.audio.uri);
        const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100MB
        if (audioInfo.exists && 'size' in audioInfo && audioInfo.size > MAX_AUDIO_SIZE) {
          throw new Error('حجم ملف الصوت كبير جداً. الحد الأقصى 100 ميجابايت');
        }

        const audioFileExtension = props.audio.name.split('.').pop() || 'mp3';
        const audioFileName = `${props.currentUser!.id}_${Date.now()}.${audioFileExtension}`;
        setUploadProgress({ phase: 'audio', percentage: 50, message: 'جاري تحميل ملف الصوت...' });
        
        audioPublicUrl = await uploadFileViaEdgeFunction(
          props.audio.uri,
          audioFileName,
          'audio',
          props.audio.mimeType || 'audio/mpeg'
        );

        setUploadProgress({ phase: 'audio', percentage: 100, message: 'تم تحميل ملف الصوت!' });
      }

      setUploadProgress({ phase: 'database', percentage: 50, message: 'جاري نشر البودكاست...' });

      // Save podcast metadata to Supabase database
      const { data, error: dbError } = await supabase
        .from('podcasts')
        .insert({
          title: props.title,
          description: props.description,
          author: props.author,
          category: props.category,
          user_id: props.currentUser!.id,
          audio_url: audioPublicUrl!,
          image_url: imagePublicUrl,
          duration: null, // Will be calculated on playback
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Failed to create podcast: ${dbError.message}`);
      }

      setUploadProgress({ phase: 'complete', percentage: 100, message: 'يرجى عدم غلق التطبيق' });

      setTimeout(() => {
        Alert.alert('نجاح!', 'تم نشر البودكاست بنجاح.', [
          {
            text: 'OK',
            onPress: () => {
              setIsUploading(false);
              setUploadProgress(null);
              if (props.onUploadComplete) {
                props.onUploadComplete();
              }
              router.push('/(tabs)/discover');
            },
          },
        ]);
      }, 500);

    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.message || 'حدث خطأ أثناء التحميل';
      Alert.alert('فشل في التحميل', errorMessage);
      // Note: Edge Function handles cleanup automatically on failure
    } finally {
      setIsUploading(false);
    }
  };

  return { isUploading, uploadProgress, handleUpload };
};
