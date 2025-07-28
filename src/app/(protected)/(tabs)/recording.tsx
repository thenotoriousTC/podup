import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView, TextInput, Image, Modal, FlatList, Dimensions, Pressable, KeyboardAvoidingView } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAudioRecorder, useAudioPlayer, RecordingPresets, AudioModule, useAudioPlayerStatus } from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { StyledText } from '@/components/StyledText';

interface Recording {
  id: string;
  uri: string;
  title: string;
  duration: number;
  createdAt: Date;
}

const categories = [
  'كوميدي',
  'مال',
  'ترفيه',
  'تكنولوجيا',
  'علوم',
  'رياضة',
  'أخبار',
  'صحة',
  'Business',
  'تعليم',
  'فن',
  'تاريخ',
];

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  const [category, setCategory] = useState('');
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  
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
    setCategory('');
    setSelectedRecording(null);
    setShowMetadataForm(false);
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
    // Guard against null values, even though the button should be disabled.
    if (!selectedRecording || !currentUser || !podcastTitle || !podcastDescription || !podcastImage || !category) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة واختيار صورة.');
      setIsUploading(false);
      return;
    }

    setIsUploading(true);
    const recordingToPublish = selectedRecording; // Create a stable reference

    try {
      console.log('Starting podcast upload...');

      // 1. Upload Cover Image
      const imageData = await FileSystem.readAsStringAsync(podcastImage, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const imageFileName = `podcast_image_${currentUser.id}_${Date.now()}.jpg`;
      const { error: imageUploadError } = await supabase.storage
        .from('podcasts')
        .upload(imageFileName, base64ToArrayBuffer(imageData), {
          contentType: 'image/jpeg',
        });

      if (imageUploadError) {
        console.error('Image upload error:', imageUploadError);
        throw imageUploadError;
      }
      const { data: publicImageUrlData } = supabase.storage.from('podcasts').getPublicUrl(imageFileName);
      const publicImageUrl = publicImageUrlData.publicUrl;
      console.log('Image uploaded successfully:', publicImageUrl);

      // 2. Upload Audio File
      const audioData = await FileSystem.readAsStringAsync(recordingToPublish.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const audioFileName = `podcast_${currentUser.id}_${Date.now()}.m4a`;
      const { error: audioUploadError } = await supabase.storage
        .from('podcasts')
        .upload(audioFileName, base64ToArrayBuffer(audioData), {
          contentType: 'audio/m4a',
        });

      if (audioUploadError) {
        console.error('Audio upload error:', audioUploadError);
        throw audioUploadError;
      }
      const { data: publicAudioUrlData } = supabase.storage.from('podcasts').getPublicUrl(audioFileName);
      const publicAudioUrl = publicAudioUrlData.publicUrl;
      console.log('Audio uploaded successfully:', publicAudioUrl);

      // 3. Save metadata to the 'podcasts' table
      console.log('Saving to database...');
      const { data: podcastData, error: podcastError } = await supabase
        .from('podcasts')
        .insert({
          user_id: currentUser.id,
          title: podcastTitle,
          author: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Anonymous',
          description: podcastDescription,
          category: category,
          image_url: publicImageUrl,
          audio_url: publicAudioUrl,
          thumbnail_url: publicImageUrl, // Using the same for simplicity
          duration: recordingToPublish.duration,
        })
        .select();

      if (podcastError) {
        console.error('Database insert error:', podcastError);
        throw podcastError;
      }

      console.log('Podcast saved to database successfully:', podcastData);

      // 4. Clean up local state and files
      await FileSystem.deleteAsync(recordingToPublish.uri);
      setRecordings(prev => prev.filter(r => r.id !== recordingToPublish.id));
      resetForm();
      setShowMetadataForm(false);
      await fetchUserPodcasts();

      Alert.alert("تم نشر المحتوى!", "تم نشر المحتوى بنجاح!", [{ text: "رائع!" }]);

    } catch (error) {
      console.error("Publish error:", error);
      Alert.alert("فشل النشر", `حدث خطأ أثناء نشر المحتوى: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
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
        <StyledText className="text-xl font-semibold text-red-500 mt-4 mb-2 text-center">
          يرجى تسجيل الدخول لتسجيل الصوت
        </StyledText>
      </View>
    );
  }

  if (hasPermission === null) {
    return (
      <View className="flex-1 bg-slate-50 justify-center items-center">
        <ActivityIndicator size="large" color="#007AFF" />
        <StyledText className="mt-4 text-base text-blue-500">
          طلب إذن...
        </StyledText>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View className="flex-1 bg-slate-50 justify-center items-center">
        <Ionicons name="mic-off" size={64} color="#FF3B30" />
        <StyledText className="text-xl font-semibold text-red-500 mt-4 mb-2 text-center">
          رفض إذن الميكروفون
        </StyledText>
        <StyledText className="text-base text-gray-600 text-center max-w-[80%]">
          يرجى تفعيل الوصول إلى الميكروفون في إعدادات جهازك
        </StyledText>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={ 'height'} className="flex-1">
      <ScrollView ref={scrollViewRef} className="flex-1 bg-slate-50 pt-10 ">
      <View className="p-4">
        {/* User Info */}
        <View className="items-center mb-8 pt-5">
          <StyledText className="text-base text-gray-600 text-center">
            تسجيل، إدارة، ونشر محتواك
          </StyledText>
        </View>

        {/* Recording Section */}
        <View className="bg-white rounded-2xl p-6 shadow-lg items-center mb-8">
          <View className={`w-32 h-32 rounded-full justify-center items-center mb-6 ${
            isRecording ? 'bg-red-50 border-4 border-red-500' : 'bg-white border-4 border-indigo-400'
          }`}>
            <Ionicons 
              name={isRecording ? "mic" : "mic"} 
              size={64} 
              color={isRecording ? "#FF3B30" : "#4F46E5"} 
            />
          </View>
          
          <StyledText className="text-2xl font-semibold text-indigo-500 mb-3 text-center">
            {isRecording ? " جاري التسجيل" : "جاهز للتسجيل"}
          </StyledText>
          {isRecording && (
            <StyledText className="text-2xl font-semibold text-indigo-500 mb-3">
              {formatTime(recordingDuration)}
            </StyledText>
          )}
          
          <TouchableOpacity 
            className={`px-8 py-4 rounded-full mt-3 ${
              isRecording ? 'bg-red-500' : 'bg-indigo-500'
            } ${isUploading ? 'opacity-50' : ''}`}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isUploading}
          >
            <StyledText className="text-white text-lg font-semibold">
              {isRecording ? "إيقاف التسجيل" : "بدء التسجيل"}
            </StyledText>
          </TouchableOpacity>
        </View>

        {/* Recordings List */}
        {recordings.length > 0 && (
          <View className="bg-white rounded-2xl p-5 mb-8 shadow-lg">
            <StyledText className="text-xl font-semibold text-gray-800 mb-4 text-center">
              تسجيلاتك ({recordings.length})
            </StyledText>
            
            {recordings.map((recording) => (
              <View key={recording.id} className="flex-row items-center justify-between p-3 mb-3 bg-gray-50 rounded-xl">
                <View className="flex-1 mr-3">
                  <StyledText className="text-base font-semibold text-gray-800 mb-1">
                    {recording.title}
                  </StyledText>
                  <StyledText className="text-sm text-gray-500">
                    {formatDate(recording.createdAt)} • {formatTime(recording.duration)}
                  </StyledText>
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
                    <Ionicons name="cloud-upload" size={24} color="#4F46E5" />
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
            <StyledText className="text-3xl font-semibold text-indigo-500 text-center mb-12 ">
              نشر محتوى
            </StyledText>
            <StyledText className="text-base text-gray-600 text-center mb-6">
              أضف التفاصيل حول محتواك
            </StyledText>
            
            {/* Cover Image Section */}
            <View className="mb-5">
              <StyledText className="text-base font-semibold text-gray-800 mb-2 text-right">
                صورة الغلاف *
              </StyledText>
              <TouchableOpacity
                className="border-2 border-separate border-indigo-400 rounded-xl p-6 items-center justify-center bg-white"
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
                  <Ionicons name="image" size={48} color="#4F46E5" />
                )}
                <StyledText className="text-base font-medium text-indigo-500 mt-2">
                  {podcastImage ? "تغيير صورة الغلاف" : "اختيار صورة الغلاف"}
                </StyledText>
              </TouchableOpacity>
            </View>
            
            {/* Title Input */}
            <View className="mb-5">
              <StyledText className="text-base font-semibold text-gray-800 mb-2 text-right">
                عنوان المحتوى *
              </StyledText>
              <TextInput
                className="rounded-lg p-3 text-base bg-gray-50 text-gray-800 text-right"
                value={podcastTitle}
                onChangeText={setPodcastTitle}
                placeholder="عنوان المحتوى..."
                placeholderTextColor="#9CA3AF"
                multiline={false}
                maxLength={100}
              />
            </View>
            
            {/* Category Picker */}
            <View className="mb-5">
              <StyledText className="text-base font-semibold text-gray-800 mb-2 text-right">
                الفئة *
              </StyledText>
              <Pressable
                onPress={() => setCategoryModalVisible(true)}
                disabled={isUploading}
                className={`bg-gray-50 p-3 rounded-lg  shadow-sm ${
                  isUploading ? 'opacity-50' : ''
                }`}
              >
                <StyledText className="text-base text-gray-800 text-right">{category || 'اختر الفئة'}</StyledText>
              </Pressable>
            </View>
            
            {/* Description Input */}
            <View className="mb-5">
              <StyledText className="text-base font-semibold text-gray-800 mb-2 text-right">
                وصف *
              </StyledText>
              <TextInput
                className="rounded-lg p-3 text-base bg-gray-50 text-gray-800 min-h-[100px] text-right"
                value={podcastDescription}
                onChangeText={setPodcastDescription}
                placeholder="وصف المحتوى..."
                placeholderTextColor="#9CA3AF"
                multiline={true}
                maxLength={500}
                textAlignVertical="top"
              />
              <StyledText className="text-sm text-gray-400 mt-1">
                {podcastDescription.length}/500 characters
              </StyledText>
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
                <StyledText className="ml-2 text-base font-semibold text-blue-500">
                  إلغاء
                </StyledText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className={`flex-1 ml-3 py-3 px-5 rounded-lg flex-row items-center justify-center ${
                  isUploading || !podcastTitle.trim() || !podcastDescription.trim() || !podcastImage || !category
                    ? 'bg-gray-400' 
                    : 'bg-green-500'
                }`}
                onPress={publishPodcast}
                disabled={isUploading || !podcastTitle.trim() || !podcastDescription.trim() || !podcastImage || !category}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="cloud-upload" size={24} color="#FFFFFF" />
                )}
                <StyledText className="text-white text-base font-semibold ml-2">
                  {isUploading ? "نشر ..." : "نشر المحتوى"}
                </StyledText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* User's Published Podcasts */}
        {userPodcasts.length > 0 && (
          <View className="items-center p-5 bg-white rounded-2xl shadow-lg mb-8">
            <StyledText className="text-lg font-semibold text-gray-800 mb-2">
              المحتوى المنشور
            </StyledText>
            <StyledText className="text-base text-blue-500">
              {userPodcasts.length} محتوى {userPodcasts.length !== 1 ? 's' : ''} منشور
            </StyledText>
          </View>
        )}
      </View>
    </ScrollView>
    

    {/* Category Modal */}
    <Modal
      animationType="slide"
      transparent={true}
      visible={isCategoryModalVisible}
      onRequestClose={() => setCategoryModalVisible(false)}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white rounded-2xl p-6 w-4/5 max-h-[70%]">
          <StyledText className="text-xl font-semibold text-gray-800 mb-4">اختر الفئة</StyledText>
          <FlatList
            data={categories}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setCategory(item);
                  setCategoryModalVisible(false);
                }}
                className="p-4 border-b border-gray-200"
              >
                <StyledText className="text-base text-gray-800">{item}</StyledText>
              </TouchableOpacity>
            )}
          />
          <Pressable
            onPress={() => setCategoryModalVisible(false)}
            className="mt-4 bg-red-500 p-3 rounded-lg items-center"
          >
            <StyledText className="text-white font-semibold">إغلاق</StyledText>
          </Pressable>
        </View>
      </View>
    </Modal></KeyboardAvoidingView>
    
  )}