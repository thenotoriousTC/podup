import { useState } from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { AudioFile, UploadProgress } from './types';
import { useRouter } from 'expo-router';
import { r2Storage } from '@/services/r2Storage';

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

  const handleUpload = async (props: UsePodcastUploadProps) => {
    if (!validateForm(props)) return;

    if (!r2Storage.isConfigured()) {
      Alert.alert('خطأ في الإعدادات', 'خدمة التخزين غير متوفرة. يرجى التواصل مع الدعم.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(null);
    let imagePublicUrl: string | null = null;
    let audioPublicUrl: string | null = null;

    try {
      // Upload image to R2
      if (props.image) {
        setUploadProgress({ phase: 'image', percentage: 0, message: 'جاري تحميل صورة الغلاف...' });
        const imageInfo = await FileSystem.getInfoAsync(props.image);
        const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
        if (imageInfo.exists && 'size' in imageInfo && imageInfo.size > MAX_IMAGE_SIZE) {
          throw new Error('حجم الصورة كبير جداً. الحد الأقصى 10 ميجابايت');
        }

        const imageFileName = `${props.currentUser!.id}_${Date.now()}.jpg`;
        const imageResult = await r2Storage.uploadFile({
          fileUri: props.image,
          fileName: imageFileName,
          contentType: 'image/jpeg',
          folder: 'images',
          onProgress: (uploaded, total) => {
            const percentage = Math.round((uploaded / total) * 100);
            setUploadProgress({ phase: 'image', percentage, message: 'جاري تحميل صورة الغلاف...' });
          },
        });

        if (!imageResult.success || !imageResult.publicUrl) {
          throw new Error(imageResult.error || 'Image upload failed');
        }

        imagePublicUrl = imageResult.publicUrl;
        setUploadProgress({ phase: 'image', percentage: 100, message: 'تم تحميل صورة الغلاف!' });
      }

      // Upload audio to R2
      if (props.audio) {
        setUploadProgress({ phase: 'audio', percentage: 0, message: 'جاري تحميل ملف الصوت...' });
        const audioInfo = await FileSystem.getInfoAsync(props.audio.uri);
        const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100MB
        if (audioInfo.exists && 'size' in audioInfo && audioInfo.size > MAX_AUDIO_SIZE) {
          throw new Error('حجم ملف الصوت كبير جداً. الحد الأقصى 100 ميجابايت');
        }

        const audioFileExtension = props.audio.name.split('.').pop() || 'mp3';
        const audioFileName = `${props.currentUser!.id}_${Date.now()}.${audioFileExtension}`;
        const audioResult = await r2Storage.uploadFile({
          fileUri: props.audio.uri,
          fileName: audioFileName,
          contentType: props.audio.mimeType || 'audio/mpeg',
          folder: 'audio',
          onProgress: (uploaded, total) => {
            const percentage = Math.round((uploaded / total) * 100);
            setUploadProgress({ phase: 'audio', percentage, message: 'جاري تحميل ملف الصوت...' });
          },
        });

        if (!audioResult.success || !audioResult.publicUrl) {
          throw new Error(audioResult.error || 'Audio upload failed');
        }

        audioPublicUrl = audioResult.publicUrl;
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
      Alert.alert('فشل في التحميل', error.message);
      // Cleanup uploaded files on error
      const urlsToCleanup = [imagePublicUrl, audioPublicUrl].filter(Boolean) as string[];
      if (urlsToCleanup.length > 0) {
        try {
          for (const url of urlsToCleanup) {
            const key = r2Storage.extractKeyFromUrl(url);
            if (key) {
              await r2Storage.deleteFile(key);
            }
          }
        } catch (cleanupError) {
          console.error('Failed to cleanup uploaded files:', cleanupError);
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

  return { isUploading, uploadProgress, handleUpload };
};
