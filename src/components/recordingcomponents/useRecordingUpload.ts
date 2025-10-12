import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import { UploadProgress, Recording } from './types';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'expo-router';

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

    setIsUploading(true);
    setUploadProgress({ phase: 'image', percentage: 0, message: 'تحميل صورة الغلاف...' });

    let imagePublicUrl: string | null = null;
    let audioPublicUrl: string | null = null;

    try {
      // Upload image via Edge Function
      console.log('📤 [DEBUG] publishRecording: Uploading image via Edge Function...');
      setUploadProgress({ phase: 'image', percentage: 50, message: 'تحميل صورة الغلاف...' });
      const imageFileName = `${currentUser.id}_${Date.now()}_recording.jpg`;
      imagePublicUrl = await uploadFileViaEdgeFunction(
        podcastImage,
        imageFileName,
        'image',
        'image/jpeg'
      );
      console.log('✅ [DEBUG] publishRecording: Image uploaded:', imagePublicUrl);
      setUploadProgress({ phase: 'image', percentage: 100, message: 'تم تحميل الصورة!' });

      // Upload audio via Edge Function
      setUploadProgress({ phase: 'audio', percentage: 0, message: 'تحميل ملف الصوت...' });
      console.log('📤 [DEBUG] publishRecording: Uploading audio via Edge Function...');
      const audioFileName = `${currentUser.id}_${Date.now()}_recording.m4a`;
      setUploadProgress({ phase: 'audio', percentage: 50, message: 'تحميل ملف الصوت...' });
      audioPublicUrl = await uploadFileViaEdgeFunction(
        selectedRecording.uri,
        audioFileName,
        'audio',
        'audio/m4a'
      );
      console.log('✅ [DEBUG] publishRecording: Audio uploaded:', audioPublicUrl);
      setUploadProgress({ phase: 'audio', percentage: 100, message: 'تم تحميل الصوت!' });

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
      const errorMessage = error instanceof Error ? error.message : 'يرجى المحاولة مرة أخرى';
      Alert.alert('فشل في النشر', `حدث خطأ: ${errorMessage}`);
      // Note: Edge Function handles cleanup automatically on failure
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
