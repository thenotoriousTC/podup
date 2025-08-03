import { useState } from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { AudioFile, UploadProgress } from './types';
import { useRouter } from 'expo-router';

const base64ToArrayBuffer = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

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

    setIsUploading(true);
    setUploadProgress(null);
    let tempImagePath: string | null = null;
    let tempAudioPath: string | null = null;

    try {
      if (props.image) {
        setUploadProgress({ phase: 'image', percentage: 0, message: 'تم تحميل صورة الغلاف!' });
        const imageData = await FileSystem.readAsStringAsync(props.image, { encoding: FileSystem.EncodingType.Base64 });
        const imageFileName = `temp/${props.currentUser!.id}_${Date.now()}.jpg`;
        
        const { data: imageUploadData, error: imageUploadError } = await supabase.storage
          .from('podcasts')
          .upload(imageFileName, base64ToArrayBuffer(imageData), { contentType: 'image/jpeg' });

        if (imageUploadError) throw new Error(`Image upload failed: ${imageUploadError.message}`);
        
        tempImagePath = imageUploadData.path;
        setUploadProgress({ phase: 'image', percentage: 100, message: 'تم تحميل صورة الغلاف!' });
      }

      if (props.audio) {
        setUploadProgress({ phase: 'audio', percentage: 0, message: 'جاري تحميل ملف الصوت...' });
        const audioData = await FileSystem.readAsStringAsync(props.audio.uri, { encoding: FileSystem.EncodingType.Base64 });
        const audioFileExtension = props.audio.name.split('.').pop() || 'mp3';
        const audioFileName = `temp/${props.currentUser!.id}_${Date.now()}.${audioFileExtension}`;

        const { data: audioUploadData, error: audioUploadError } = await supabase.storage
          .from('podcasts')
          .upload(audioFileName, base64ToArrayBuffer(audioData), { contentType: props.audio.mimeType || 'audio/mpeg' });

        if (audioUploadError) throw new Error(`Audio upload failed: ${audioUploadError.message}`);

        tempAudioPath = audioUploadData.path;
        setUploadProgress({ phase: 'audio', percentage: 100, message: 'تم تحميل ملف الصوت!' });
      }

      setUploadProgress({ phase: 'database', percentage: 50, message: 'جاري نشر البودكاست...' });

      const { data, error: functionError } = await supabase.functions.invoke('create-podcast', {
        body: {
          title: props.title,
          description: props.description,
          author: props.author,
          category: props.category,
          userId: props.currentUser!.id,
          tempImagePath,
          tempAudioPath,
          audioMimeType: props.audio?.mimeType,
        },
      });

      if (functionError) {
        throw new Error(`Failed to create podcast: ${functionError.message}`);
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
      const filesToRemove = [tempImagePath, tempAudioPath].filter(Boolean) as string[];
      if (filesToRemove.length > 0) {
        await supabase.storage.from('podcasts').remove(filesToRemove);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return { isUploading, uploadProgress, handleUpload };
};
