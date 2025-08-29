import { useState } from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import { UploadProgress, Recording } from './types';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'expo-router';

const base64ToArrayBuffer = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// This is a simplified version for demonstration. For production, use a robust library like tus-js-client for resumable uploads.
async function uploadFile(fileUri: string, bucket: string, path: string, onProgress: (bytesUploaded: number, bytesTotal: number) => void) {
  const fileInfo = await FileSystem.getInfoAsync(fileUri);
  if (!fileInfo.exists) {
    throw new Error('File does not exist.');
  }

  const fileData = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, base64ToArrayBuffer(fileData), { 
      contentType: fileUri.endsWith('.m4a') ? 'audio/m4a' : 'image/jpeg',
      upsert: true,
      // Progress tracking with base64 isn't straightforward. This is a mock progress.
      // For real progress, you'd need a different upload method (e.g., streaming or tus-js-client).
    });

  if (error) {
    throw error;
  }
  // Mocking progress for base64 upload
  onProgress(fileInfo.size, fileInfo.size);
}

export const useRecordingUpload = () => {
  const { user: currentUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const router = useRouter();

  const publishRecording = async (
    {
      podcastTitle,
      podcastDescription,
      podcastImage,
      category,
      selectedRecording,
    }: {
      podcastTitle: string;
      podcastDescription: string;
      podcastImage: string | null;
      category: string;
      selectedRecording: Recording | null;
    },
    onUploadComplete: () => void
  ) => {
    if (!selectedRecording || !currentUser || !podcastTitle || !podcastDescription || !podcastImage || !category) {
      Alert.alert('يجب إكمال جميع الحقول', 'يرجى إكمال جميع الحقول وتحديد صورة.');
      return;
    }

    setIsUploading(true);
    setUploadProgress({ phase: 'image', percentage: 0, message: 'تحميل صورة الغلاف...' });

    try {
      const tempImagePath = `temp/${currentUser.id}/${Date.now()}_image.jpg`;
      await uploadFile(podcastImage, 'podcasts', tempImagePath, (bytesUploaded, bytesTotal) => {
        setUploadProgress({ 
          phase: 'image', 
          percentage: (bytesUploaded / bytesTotal) * 100, 
          message: 'تحميل صورة الغلاف...'
        });
      });

      setUploadProgress({ phase: 'audio', percentage: 0, message: 'تحميل ملف الصوت...' });
      const tempAudioPath = `temp/${currentUser.id}/${Date.now()}_audio.m4a`;
      await uploadFile(selectedRecording.uri, 'podcasts', tempAudioPath, (bytesUploaded, bytesTotal) => {
        setUploadProgress({ 
          phase: 'audio', 
          percentage: (bytesUploaded / bytesTotal) * 100, 
          message: 'تحميل ملف الصوت...'
        });
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      setUploadProgress({ phase: 'database', percentage: 0, message: 'جاري نشر البودكاست...' });

      const { error: functionError } = await supabase.functions.invoke('create-podcast', {
        body: {
          title: podcastTitle,
          description: podcastDescription,
          author: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Anonymous',
          category,
          userId: currentUser.id,
          tempImagePath,
          tempAudioPath,
        },
      });

      if (functionError) {
        throw new Error(`Edge function failed: ${functionError.message}`);
      }

      setUploadProgress({ phase: 'complete', percentage: 100, message: 'تم نشر البودكاست بنجاح!' });
      setTimeout(() => {
        Alert.alert('نجاح!', 'تم نشر البودكاست بنجاح!', [
          {
            text: 'OK',
            onPress: () => {
              setIsUploading(false);
              setUploadProgress(null);
              onUploadComplete();
              router.push('/(tabs)/discover');
            },
          },
        ]);
      }, 500);

    } catch (error) {
      console.error('Publish error:', error);
      Alert.alert('فشل في النشر', `حدث خطأ: ${error instanceof Error ? error.message : 'يرجى المحاولة مرة أخرى'}`);
      // Here you might want to add cleanup logic for temp files if the edge function call fails
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  return {
    isUploading,
    uploadProgress,
    publishRecording,
  };
};
