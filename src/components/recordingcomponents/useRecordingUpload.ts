import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import { UploadProgress, Recording } from './types';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'expo-router';
import { r2Storage } from '@/services/r2Storage';

export const useRecordingUpload = () => {
  console.log('🟨 [DEBUG] useRecordingUpload: Hook invoked');
  const { user: currentUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const router = useRouter();

  console.log('🟦 [DEBUG] useRecordingUpload state:', {
    isUploading,
    uploadProgress: uploadProgress?.phase,
    uploadPercentage: uploadProgress?.percentage,
  });

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
    console.log('📤 [DEBUG] publishRecording: START');
    console.log('📤 [DEBUG] publishRecording: selectedRecording:', selectedRecording?.id);
    console.log('📤 [DEBUG] publishRecording: currentUser:', !!currentUser?.id);
    
    if (!selectedRecording || !currentUser || !podcastTitle || !podcastDescription || !podcastImage || !category) {
      console.log('❌ [DEBUG] publishRecording: Missing required fields');
      Alert.alert('يجب إكمال جميع الحقول', 'يرجى إكمال جميع الحقول وتحديد صورة.');
      return;
    }

    console.log('📤 [DEBUG] publishRecording: Starting upload process...');

    if (!r2Storage.isConfigured()) {
      console.log('❌ [DEBUG] publishRecording: R2 not configured');
      Alert.alert('خطأ في الإعدادات', 'خدمة التخزين غير متوفرة. يرجى التواصل مع الدعم.');
      return;
    }

    setIsUploading(true);
    setUploadProgress({ phase: 'image', percentage: 0, message: 'تحميل صورة الغلاف...' });

    let imagePublicUrl: string | null = null;
    let audioPublicUrl: string | null = null;

    try {
      // Upload image to R2
      console.log('📤 [DEBUG] publishRecording: Uploading image to R2...');
      const imageFileName = `${currentUser.id}_${Date.now()}_recording.jpg`;
      const imageResult = await r2Storage.uploadFile({
        fileUri: podcastImage,
        fileName: imageFileName,
        contentType: 'image/jpeg',
        folder: 'images',
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
          setUploadProgress({ 
            phase: 'image', 
            percentage, 
            message: 'تحميل صورة الغلاف...'
          });
        },
      });

      if (!imageResult.success || !imageResult.publicUrl) {
        throw new Error(imageResult.error || 'Image upload failed');
      }

      imagePublicUrl = imageResult.publicUrl;
      console.log('✅ [DEBUG] publishRecording: Image uploaded:', imagePublicUrl);

      // Upload audio to R2
      setUploadProgress({ phase: 'audio', percentage: 0, message: 'تحميل ملف الصوت...' });
      console.log('📤 [DEBUG] publishRecording: Uploading audio to R2...');
      const audioFileName = `${currentUser.id}_${Date.now()}_recording.m4a`;
      const audioResult = await r2Storage.uploadFile({
        fileUri: selectedRecording.uri,
        fileName: audioFileName,
        contentType: 'audio/m4a',
        folder: 'audio',
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
          setUploadProgress({ 
            phase: 'audio', 
            percentage, 
            message: 'تحميل ملف الصوت...'
          });
        },
      });

      if (!audioResult.success || !audioResult.publicUrl) {
        throw new Error(audioResult.error || 'Audio upload failed');
      }

      audioPublicUrl = audioResult.publicUrl;
      console.log('✅ [DEBUG] publishRecording: Audio uploaded:', audioPublicUrl);

      setUploadProgress({ phase: 'database', percentage: 0, message: 'جاري نشر البودكاست...' });

      // Save podcast metadata to Supabase database
      const { data, error: dbError } = await supabase
        .from('podcasts')
        .insert({
          title: podcastTitle,
          description: podcastDescription,
          author: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Anonymous',
          category,
          user_id: currentUser.id,
          audio_url: audioPublicUrl,
          image_url: imagePublicUrl,
          duration: null, // Will be calculated on playback
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      console.log('✅ [DEBUG] publishRecording: Upload successful!');
      setUploadProgress({ phase: 'complete', percentage: 100, message: 'تم نشر البودكاست بنجاح!' });
      
      const finish = () => {
        console.log('🏁 [DEBUG] publishRecording: finish() called');
        console.log('🏁 [DEBUG] publishRecording: Setting isUploading to false');
        setIsUploading(false);
        console.log('🏁 [DEBUG] publishRecording: Clearing upload progress');
        setUploadProgress(null);
        console.log('🏁 [DEBUG] publishRecording: Calling onUploadComplete callback');
        onUploadComplete();
        console.log('🏁 [DEBUG] publishRecording: Navigating to discover tab');
        router.push('/(tabs)/discover');
        console.log('🏁 [DEBUG] publishRecording: finish() COMPLETE');
      };
      
      console.log('⏰ [DEBUG] publishRecording: Setting timeout for success alert');
      setTimeout(() => {
        console.log('⏰ [DEBUG] publishRecording: Timeout triggered, showing success alert');
        Alert.alert('نجاح!', 'تم نشر البودكاست بنجاح!', [{ text: 'OK', onPress: finish }]);
      }, 300);

    } catch (error) {
      console.error('❌ [DEBUG] publishRecording: Upload error:', error);
      Alert.alert('فشل في النشر', `حدث خطأ: ${error instanceof Error ? error.message : 'يرجى المحاولة مرة أخرى'}`);
      // Cleanup uploaded files on error
      const urlsToCleanup = [imagePublicUrl, audioPublicUrl].filter(Boolean) as string[];
      if (urlsToCleanup.length > 0) {
        try {
          console.log('🧹 [DEBUG] publishRecording: Cleaning up uploaded files...');
          for (const url of urlsToCleanup) {
            const key = r2Storage.extractKeyFromUrl(url);
            if (key) {
              await r2Storage.deleteFile(key);
            }
          }
          console.log('🧹 [DEBUG] publishRecording: Files cleaned up');
        } catch (cleanupError) {
          console.error('❌ [DEBUG] publishRecording: Failed to cleanup files:', cleanupError);
        }
      }
    } finally {
      console.log('🔚 [DEBUG] publishRecording: Finally block executed');
      console.log('🔚 [DEBUG] publishRecording: Current upload progress phase:', uploadProgress?.phase);
      // Do not clear success state here; only clear on error path
      // If we got here due to an error, isUploading is still true — clear it.
      // If success path executed, finish() will handle cleanup.
      // Heuristic: only clear if we are not in 'complete' phase.
      setIsUploading(prev => {
        const shouldClear = uploadProgress?.phase !== 'complete';
        console.log('🔚 [DEBUG] publishRecording: Should clear isUploading?', shouldClear);
        return shouldClear ? false : prev;
      });
      if (uploadProgress?.phase !== 'complete') {
        console.log('🔚 [DEBUG] publishRecording: Clearing upload progress in finally');
        setUploadProgress(null);
      }
      console.log('🔚 [DEBUG] publishRecording: Finally block COMPLETE');
    }
  };

  return {
    isUploading,
    uploadProgress,
    publishRecording,
  };
};
