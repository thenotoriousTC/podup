import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView, TextInput, Image } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAudioRecorder, useAudioPlayer, RecordingPresets, AudioModule, useAudioPlayerStatus } from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

interface Recording {
  id: string;
  uri: string;
  title: string;
  duration: number;
  createdAt: Date;
}

export default function RecordingScreen() {
  const { user: currentUser } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [userPodcasts, setUserPodcasts] = useState<any[]>([]);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const metadataFormRef = useRef<View>(null);
  // const supabaseClient = supabase; // Supabase client is directly used via import
  
  // Form fields for podcast metadata
  const [podcastTitle, setPodcastTitle] = useState('');
  const [podcastDescription, setPodcastDescription] = useState('');
  const [podcastImage, setPodcastImage] = useState<string | null>(null);
  const [showMetadataForm, setShowMetadataForm] = useState(false);
  
  // Audio recorder and player
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const audioPlayer = useAudioPlayer();
  const playerStatus = useAudioPlayerStatus(audioPlayer);

  useEffect(() => {
    const getPermissions = async () => {
      try {
        // Request microphone permissions
        const audioStatus = await AudioModule.requestRecordingPermissionsAsync();
        
        // Request camera permissions for image picker
        const imageStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        setHasPermission(audioStatus.granted);
        
        if (!audioStatus.granted) {
          Alert.alert(
            "Permission Required", 
            "نحتاج إلى الوصول إلى الميكروفون لتسجيل الصوت."
          );
        }
        
        if (!imageStatus.granted) {
          Alert.alert(
            "Permission Required", 
            "نحتاج إلى الوصول إلى المكتبة الصور لاختيار صورة الغلاف."
          );
        }
      } catch (error) {
        console.error("Error requesting permissions:", error);
        setHasPermission(false);
      }
    };
    
    getPermissions();
    if (currentUser?.id) {
      fetchUserPodcasts();
    }
    loadSavedRecordings();
  }, [currentUser]);

  // Timer for recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else if (!isRecording && recordingDuration !== 0) {
      setRecordingDuration(0);
      if (interval) clearInterval(interval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Monitor audio player state
  useEffect(() => {
    if (!playerStatus.playing) {
      setCurrentPlayingId(null);
    }
  }, [playerStatus.playing]);

  const loadSavedRecordings = async () => {
    try {
      const recordingsDir = FileSystem.documentDirectory + 'recordings/';
      const dirExists = await FileSystem.getInfoAsync(recordingsDir);
      
      if (!dirExists.exists) {
        await FileSystem.makeDirectoryAsync(recordingsDir, { intermediates: true });
        return;
      }
      
      const files = await FileSystem.readDirectoryAsync(recordingsDir);
      const recordingFiles = files.filter(file => file.endsWith('.m4a'));
      
      const loadedRecordings: Recording[] = [];
      
      for (const file of recordingFiles) {
        const filePath = recordingsDir + file;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        
        // Extract metadata from filename (you might want to store this differently)
        const parts = file.replace('.m4a', '').split('_');
        const timestamp = parseInt(parts[parts.length - 1]) || Date.now();
        
        loadedRecordings.push({
          id: file.replace('.m4a', ''),
          uri: filePath,
          title: `Recording ${loadedRecordings.length + 1}`,
          duration: 0, // You might want to calculate actual duration
          createdAt: new Date(timestamp)
        });
      }
      
      setRecordings(loadedRecordings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (error) {
      console.error('Error loading recordings:', error);
    }
  };

  const fetchUserPodcasts = async () => {
    if (!currentUser?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('podcasts')
        .select('*')
        .eq('author', currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Anonymous')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUserPodcasts(data || []);
    } catch (error) {
      console.error('Error fetching user podcasts:', error);
    }
  };

  const startRecording = async () => {
    if (!currentUser?.id) {
      Alert.alert("Error", "يرجى تسجيل الدخول لتسجيل الصوت");
      return;
    }

    try {
      console.log('Starting recording...');
      setShowMetadataForm(false);
      resetForm();
      
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
      Alert.alert("Error", "فشل في بدء التسجيل");
    }
  };

  const stopRecording = async () => {
    try {
      console.log('Stopping recording...');
      await audioRecorder.stop();
      setIsRecording(false);
      
      const recordingUri = audioRecorder.uri;
      console.log('Recording URI:', recordingUri);
      
      if (recordingUri) {
        // Create recordings directory if it doesn't exist
        const recordingsDir = FileSystem.documentDirectory + 'recordings/';
        const dirExists = await FileSystem.getInfoAsync(recordingsDir);
        
        if (!dirExists.exists) {
          await FileSystem.makeDirectoryAsync(recordingsDir, { intermediates: true });
        }
        
        // Save with unique filename
        const timestamp = Date.now();
        const fileName = `${currentUser?.id}_recording_${timestamp}.m4a`;
        const permanentUri = recordingsDir + fileName;
        
        try {
          await FileSystem.copyAsync({
            from: recordingUri,
            to: permanentUri,
          });
          
          const newRecording: Recording = {
            id: fileName.replace('.m4a', ''),
            uri: permanentUri,
            title: `Recording ${recordings.length + 1}`,
            duration: recordingDuration,
            createdAt: new Date(timestamp)
          };
          
          setRecordings(prev => [newRecording, ...prev]);
          setSelectedRecording(newRecording);
          
          console.log('Recording saved to:', permanentUri);
          
          Alert.alert(
            "تم حفظ المحتوى!", 
            "تم حفظ المحتوى بنجاح. يمكنك الآن سماعه ونشره كمحتوى.",
            [{ text: "حسنًا" }]
          );
        } catch (fileError) {
          console.error('Error saving file:', fileError);
          Alert.alert("خطأ", "فشل في حفظ المحتوى");
        }
      } else {
        console.error('No recording URI available');
        Alert.alert("خطأ", "فشل في حفظ المحتوى");
      }
    } catch (error) {
      console.error("Failed to stop recording:", error);
      Alert.alert("خطأ", "فشل في إيقاف التسجيل");
    }
  };

  const playRecording = async (recording: Recording) => {
    try {
      if (currentPlayingId === recording.id && playerStatus.playing) {
        audioPlayer.pause();
        setCurrentPlayingId(null);
      } else {
        audioPlayer.replace({ uri: recording.uri });
        audioPlayer.play();
        setCurrentPlayingId(recording.id);
      }
    } catch (error) {
      console.error("Error playing recording:", error);
      Alert.alert("خطأ", "فشل في تشغيل المحتوى");
    }
  };

  const deleteRecording = async (recording: Recording) => {
    Alert.alert(
      "حذف المحتوى",
      "هل أنت متأكد من حذف هذا المحتوى؟",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            try {
              await FileSystem.deleteAsync(recording.uri);
              setRecordings(prev => prev.filter(r => r.id !== recording.id));
              
              if (selectedRecording?.id === recording.id) {
                setSelectedRecording(null);
                setShowMetadataForm(false);
                resetForm();
              }
              
              if (currentPlayingId === recording.id) {
                audioPlayer.pause();
                setCurrentPlayingId(null);
              }
              
              Alert.alert("تم حذف المحتوى", "تم حذف المحتوى بنجاح");
            } catch (error) {
              console.error("Error deleting recording:", error);
              Alert.alert("خطأ", "فشل في حذف المحتوى");
            }
          }
        }
      ]
    );
  };

  const selectRecordingForPublish = (recording: Recording) => {
    setSelectedRecording(recording);
    setShowMetadataForm(true);
    // Pre-fill title with recording title
    setPodcastTitle(recording.title);
    
    // Scroll to metadata form after a short delay to ensure it's rendered
    setTimeout(() => {
      metadataFormRef.current?.measureInWindow((x, y) => {
        scrollViewRef.current?.scrollTo({
          y: y - 100, // Offset to show some content above the form
          animated: true
        });
      });
    }, 100);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPodcastImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('خطأ', 'فشل في اختيار الصورة');
    }
  };

  const resetForm = () => {
    setPodcastTitle('');
    setPodcastDescription('');
    setPodcastImage(null);
    setSelectedRecording(null);
  };

  // Helper function to convert base64 to ArrayBuffer for upload
  const base64ToArrayBuffer = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const publishPodcast = async () => {
    if (!selectedRecording || !currentUser?.id || !podcastTitle.trim() || !podcastDescription.trim() || !podcastImage) {
      Alert.alert("خطأ", "الرجاء تقديم عنوان، ووصف، وصورة لغلاف المحتوى");
      return;
    }
    
    setIsUploading(true);
    
    try {
      console.log('Starting podcast upload...');
      
      // Upload image first
      let imageUrl = null;
      if (podcastImage) {
        console.log('Uploading image...');
        const imageData = await FileSystem.readAsStringAsync(podcastImage, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        const imageFileName = `podcast_image_${currentUser.id}_${Date.now()}.jpg`;
        
        // Upload image to storage
        const { data: imageUploadData, error: imageUploadError } = await supabase.storage
          .from('podcasts')
          .upload(imageFileName, base64ToArrayBuffer(imageData), {
            contentType: 'image/jpeg',
          });
        
        if (imageUploadError) {
          console.error('Image upload error:', imageUploadError);
          throw imageUploadError;
        }
        
        // Get public URL for image
        const { data: imageUrlData } = supabase.storage
          .from('podcasts')
          .getPublicUrl(imageFileName);
        
        imageUrl = imageUrlData.publicUrl;
        console.log('Image uploaded successfully:', imageUrl);
      }
      
      // Upload audio file
      console.log('Uploading audio...');
      const audioData = await FileSystem.readAsStringAsync(selectedRecording.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const audioFileName = `podcast_${currentUser.id}_${Date.now()}.m4a`;
      
      // Upload audio to Supabase Storage
      const { data: audioUploadData, error: audioUploadError } = await supabase.storage
        .from('podcasts')
        .upload(audioFileName, base64ToArrayBuffer(audioData), {
          contentType: 'audio/m4a',
        });
      
      if (audioUploadError) {
        console.error('Audio upload error:', audioUploadError);
        throw audioUploadError;
      }
      
      // Get public URL for audio
      const { data: audioUrlData } = supabase.storage
        .from('podcasts')
        .getPublicUrl(audioFileName);
      
      console.log('Audio uploaded successfully:', audioUrlData.publicUrl);
      
      // Save to podcasts table
      console.log('Saving to database...');
      const { error: dbError } = await supabase
        .from('podcasts')
        .insert({
          title: podcastTitle.trim(),
          description: podcastDescription.trim(),
          author: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Anonymous',
          audio_url: audioUrlData.publicUrl,
          image_url: imageUrl,
          thumbnail_url: imageUrl, // For compatibility with existing seeded data

          duration: selectedRecording.duration,
          created_at: new Date().toISOString(),
        });
      
      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }
      
      console.log('Podcast saved to database successfully');
      
      // Clean up: remove from recordings list and delete local file
      await FileSystem.deleteAsync(selectedRecording.uri);
      setRecordings(prev => prev.filter(r => r.id !== selectedRecording.id));
      
      // Reset form
      resetForm();
      setShowMetadataForm(false);
      
      // Refresh the published podcasts list
      await fetchUserPodcasts();
      
      Alert.alert(
        "تم نشر المحتوى!",
        "تم نشر المحتوى بنجاح!",
        [{ text: "رائع!" }]
      );
      
    } catch (error) {
      console.error("Publish error:", error);
      Alert.alert("فشل النشر", `حدث خطأ أثناء نشر المحتوى: ${error || 'خطأ غير معروف'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!currentUser) {
    return (
      <View className="flex-1 bg-slate-50 justify-center items-center">
        <Ionicons name="person-circle-outline" size={64} color="#007AFF" />
        <Text className="text-xl font-bold text-red-500 mt-4 mb-2 text-center">
          يرجى تسجيل الدخول لتسجيل الصوت
        </Text>
      </View>
    );
  }

  if (hasPermission === null) {
    return (
      <View className="flex-1 bg-slate-50 justify-center items-center">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="mt-4 text-base text-blue-500">
          طلب إذن...
        </Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View className="flex-1 bg-slate-50 justify-center items-center">
        <Ionicons name="mic-off" size={64} color="#FF3B30" />
        <Text className="text-xl font-bold text-red-500 mt-4 mb-2 text-center">
          رفض إذن الميكروفون
        </Text>
        <Text className="text-base text-gray-600 text-center max-w-[80%]">
          يرجى تفعيل الوصول إلى الميكروفون في إعدادات جهازك
        </Text>
      </View>
    );
  }

  return (
    <ScrollView ref={scrollViewRef} className="flex-1 bg-slate-50 pt-10 ">
      <View className="p-4">
        {/* User Info */}
        <View className="items-center mb-8 pt-5">
          <Text className="text-base text-gray-600 text-center">
            تسجيل، إدارة، ونشر محتواك
          </Text>
        </View>

        {/* Recording Section */}
        <View className="bg-white rounded-2xl p-6 shadow-lg items-center mb-8">
          <View className={`w-32 h-32 rounded-full justify-center items-center mb-6 ${
            isRecording ? 'bg-red-50 border-4 border-red-500' : 'bg-white border-4 border-blue-200'
          }`}>
            <Ionicons 
              name={isRecording ? "mic" : "mic"} 
              size={64} 
              color={isRecording ? "#FF3B30" : "#007AFF"} 
            />
          </View>
          
          <Text className="text-2xl font-bold text-blue-500 mb-3 text-center">
            {isRecording ? " جاري التسجيل" : "جاهز للتسجيل"}
          </Text>
          
          {isRecording && (
            <Text className="text-2xl font-bold text-red-500 mb-3">
              {formatTime(recordingDuration)}
            </Text>
          )}
          
          <TouchableOpacity 
            className={`px-8 py-4 rounded-full mt-3 ${
              isRecording ? 'bg-red-500' : 'bg-blue-500'
            } ${isUploading ? 'opacity-50' : ''}`}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isUploading}
          >
            <Text className="text-white text-lg font-bold">
              {isRecording ? "إيقاف التسجيل" : "بدء التسجيل"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recordings List */}
        {recordings.length > 0 && (
          <View className="bg-white rounded-2xl p-5 mb-8 shadow-lg">
            <Text className="text-xl font-bold text-gray-800 mb-4 text-center">
              تسجيلاتك ({recordings.length})
            </Text>
            
            {recordings.map((recording) => (
              <View key={recording.id} className="flex-row items-center justify-between p-3 mb-3 bg-gray-50 rounded-xl">
                <View className="flex-1 mr-3">
                  <Text className="text-base font-semibold text-gray-800 mb-1">
                    {recording.title}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {formatDate(recording.createdAt)} • {formatTime(recording.duration)}
                  </Text>
                </View>
                
                <View className="flex-row items-center">
                  <TouchableOpacity
                    className="p-2 mr-2"
                    onPress={() => playRecording(recording)}
                    disabled={isUploading}
                  >
                    <Feather
                      name={currentPlayingId === recording.id && playerStatus.playing ? "pause" : "play"}
                      size={24}
                      color="black"
                    />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    className="p-2 mr-2"
                    onPress={() => selectRecordingForPublish(recording)}
                    disabled={isUploading}
                  >
                    <Ionicons name="cloud-upload" size={24} color="#3b82f6" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    className="p-2"
                    onPress={() => deleteRecording(recording)}
                    disabled={isUploading}
                  >
                    <Ionicons name="trash" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Metadata Form Section */}
        {showMetadataForm && selectedRecording && (
          <View ref={metadataFormRef} className="bg-white rounded-2xl p-5 mb-6 shadow-lg">
            <Text className="text-xl font-bold text-gray-800 text-center mb-2">
              نشر محتوى
            </Text>
            <Text className="text-base text-gray-600 text-center mb-6">
              أضف التفاصيل حول محتوىك
            </Text>
            
            {/* Cover Image Section */}
            <View className="mb-5">
              <Text className="text-base font-semibold text-gray-800 mb-2">
                صورة الغلاف *
              </Text>
              <TouchableOpacity
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 items-center justify-center bg-gray-50"
                onPress={pickImage}
                disabled={isUploading}
              >
                {podcastImage ? (
                  <Image
                    source={{ uri: podcastImage }}
                    className="w-24 h-24 rounded-lg mb-2"
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name="image" size={48} color="#9CA3AF" />
                )}
                <Text className="text-base font-medium text-blue-500 mt-2">
                  {podcastImage ? "تغيير صورة الغلاف" : "اختيار صورة الغلاف"}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Title Input */}
            <View className="mb-5">
              <Text className="text-base font-semibold text-gray-800 mb-2">
                عنوان المحتوى *
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-3 text-base bg-gray-50 text-gray-800"
                value={podcastTitle}
                onChangeText={setPodcastTitle}
                placeholder="عنوان المحتوى..."
                placeholderTextColor="#9CA3AF"
                multiline={false}
                maxLength={100}
              />
            </View>
            
            {/* Description Input */}
            <View className="mb-5">
              <Text className="text-base font-semibold text-gray-800 mb-2">
                وصف *
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-3 text-base bg-gray-50 text-gray-800 min-h-[100px]"
                value={podcastDescription}
                onChangeText={setPodcastDescription}
                placeholder="وصف المحتوى..."
                placeholderTextColor="#9CA3AF"
                multiline={true}
                maxLength={500}
                textAlignVertical="top"
              />
              <Text className="text-sm text-gray-400 mt-1">
                {podcastDescription.length}/500 characters
              </Text>
            </View>
            
            <View className="flex-row justify-between items-center">
              <TouchableOpacity 
                className={`flex-row items-center py-3 px-4 rounded-lg bg-gray-100 ${
                  isUploading ? 'opacity-50' : ''
                }`}
                onPress={() => {
                  setShowMetadataForm(false);
                  resetForm();
                }}
                disabled={isUploading}
              >
                <Ionicons name="arrow-back" size={20} color="#007AFF" />
                <Text className="ml-2 text-base font-semibold text-blue-500">
                  إلغاء
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className={`flex-1 ml-3 py-3 px-5 rounded-lg flex-row items-center justify-center ${
                  isUploading || !podcastTitle.trim() || !podcastDescription.trim() || !podcastImage
                    ? 'bg-gray-400' 
                    : 'bg-green-500'
                }`}
                onPress={publishPodcast}
                disabled={isUploading || !podcastTitle.trim() || !podcastDescription.trim() || !podcastImage}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="cloud-upload" size={24} color="#FFFFFF" />
                )}
                <Text className="text-white text-base font-bold ml-2">
                  {isUploading ? "نشر ..." : "نشر المحتوى"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* User's Published Podcasts */}
        {userPodcasts.length > 0 && (
          <View className="items-center p-5 bg-white rounded-2xl shadow-lg mb-8">
            <Text className="text-lg font-bold text-gray-800 mb-2">
              المحتوى المنشور
            </Text>
            <Text className="text-base text-blue-500">
              {userPodcasts.length} محتوى {userPodcasts.length !== 1 ? 's' : ''} منشور
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}