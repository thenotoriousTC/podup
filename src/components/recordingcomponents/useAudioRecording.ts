import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useAudioRecorder, useAudioPlayer, RecordingPresets, AudioModule, useAudioPlayerStatus } from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import { Recording } from './types';

const RECORDINGS_DIR = FileSystem.documentDirectory + 'recordings/';

export const useAudioRecording = (currentUser: { id: string } | null) => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const audioPlayer = useAudioPlayer();
  const playerStatus = useAudioPlayerStatus(audioPlayer);

  useEffect(() => {
    console.log('🎤 [PERF] Requesting recording permissions...');
    AudioModule.requestRecordingPermissionsAsync().then(status => {
      console.log('🎤 [PERF] Permission result:', status.granted);
      setHasPermission(status.granted);
    });
  }, []);

  const requestPermission = async () => {
    const status = await AudioModule.requestRecordingPermissionsAsync();
    setHasPermission(status.granted);
    return status.granted;
  };

  useEffect(() => {
    console.log('⏱️ [PERF] Recording duration effect triggered, isRecording:', isRecording);
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRecording) {
      console.log('⏱️ [PERF] Starting duration timer...');
      interval = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration % 10 === 0) console.log('⏱️ [PERF] Recording duration:', newDuration, 's');
          return newDuration;
        });
      }, 1000);
    } else {
      console.log('⏱️ [PERF] Resetting duration timer...');
      setRecordingDuration(0);
    }
    return () => {
      if (interval) {
        console.log('⏱️ [PERF] Clearing duration timer...');
        clearInterval(interval);
      }
    };
  }, [isRecording]);

  useEffect(() => {
    console.log('🎵 [PERF] Player status effect triggered, playing:', playerStatus.playing);
    if (!playerStatus.playing) {
      console.log('🎵 [PERF] Clearing current playing ID...');
      setCurrentPlayingId(null);
    }
  }, [playerStatus.playing]);

  // Cleanup audio player on unmount
  useEffect(() => {
    return () => {
      if (audioPlayer) {
        audioPlayer.pause();
      }
    };
  }, [audioPlayer]);

  const loadSavedRecordings = async () => {
    console.log('🔄 [PERF] loadSavedRecordings: START');
    const startTime = Date.now();
    try {
      console.log('📁 [PERF] Checking directory existence:', RECORDINGS_DIR);
      const dirExists = await FileSystem.getInfoAsync(RECORDINGS_DIR);
      if (!dirExists.exists) {
        console.log('📁 [PERF] Directory does not exist, creating...');
        await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, { intermediates: true });
        console.log('✅ [PERF] loadSavedRecordings: COMPLETE (no files) in', Date.now() - startTime, 'ms');
        return;
      }
      console.log('📂 [PERF] Reading directory contents...');
      const files = await FileSystem.readDirectoryAsync(RECORDINGS_DIR);
      console.log('📂 [PERF] Found', files.length, 'files:', files);
      const loadedRecordings: Recording[] = [];
      for (const file of files.filter(f => f.endsWith('.m4a'))) {
        const parts = file.split('_');
        if (parts.length !== 3) {
          console.warn(`Unexpected filename format: ${file}`);
          continue;
        }
        const timestampStr = parts[parts.length - 1]?.replace('.m4a', '');
        const timestamp = timestampStr ? parseInt(timestampStr) : Date.now();
        
        if (isNaN(timestamp) || timestamp <= 0) {
          console.warn(`Invalid timestamp in filename: ${file}`);
          continue;
        }
        
        loadedRecordings.push({
          id: file.replace('.m4a', ''),
          uri: RECORDINGS_DIR + file,
          title: `تسجيل ${loadedRecordings.length + 1}`,
          duration: 0, // This would require reading metadata, simplifying for now
          createdAt: new Date(timestamp)
        });
      }
      console.log('📊 [PERF] Processed', loadedRecordings.length, 'recordings');
      console.log('🔄 [PERF] Sorting and setting recordings state...');
      setRecordings(loadedRecordings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      console.log('✅ [PERF] loadSavedRecordings: COMPLETE in', Date.now() - startTime, 'ms');
    } catch (error) {
      console.error('❌ [PERF] Error loading recordings:', error);
      console.log('❌ [PERF] loadSavedRecordings: FAILED in', Date.now() - startTime, 'ms');
    }
  };

  const startRecording = async () => {
    if (!currentUser?.id) {
      Alert.alert("يجب تسجيل الدخول", "يرجى تسجيل الدخول لتسجيل الصوت.");
      return;
    }
    try {
      await audioRecorder.prepareToRecordAsync();
      await audioRecorder.record();
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
      Alert.alert("خطأ", "فشل في بدء التسجيل.");
    }
  };

  const stopRecording = async () => {
    console.log('🛑 [PERF] stopRecording: START');
    const startTime = Date.now();
    try {
      console.log('🎙️ [PERF] Stopping audio recorder...');
      await audioRecorder.stop();
      console.log('🎙️ [PERF] Audio recorder stopped in', Date.now() - startTime, 'ms');
      setIsRecording(false);
      const uri = audioRecorder.uri;
      console.log('📁 [PERF] Recording URI:', uri);
      if (uri) {
        // Ensure directory exists
        const dirInfo = await FileSystem.getInfoAsync(RECORDINGS_DIR);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, { intermediates: true });
        }
        
        const timestamp = Date.now();
        const fileName = `${currentUser?.id}_recording_${timestamp}.m4a`;
        const permanentUri = RECORDINGS_DIR + fileName;
        console.log('📁 [PERF] Copying file from', uri, 'to', permanentUri);
        const copyStartTime = Date.now();
        await FileSystem.copyAsync({ from: uri, to: permanentUri });
        console.log('📁 [PERF] File copy completed in', Date.now() - copyStartTime, 'ms');
        const newRecording: Recording = {
          id: fileName.replace('.m4a', ''),
          uri: permanentUri,
          title: `تسجيل ${recordings.length + 1}`,
          duration: recordingDuration,
          createdAt: new Date(timestamp)
        };
        console.log('🔄 [PERF] Adding recording to state...');
        setRecordings(prev => [newRecording, ...prev]);
        console.log('✅ [PERF] stopRecording: COMPLETE in', Date.now() - startTime, 'ms');
        return newRecording;
      }
    } catch (error) {
      console.error("❌ [PERF] Failed to stop recording:", error);
      console.log('❌ [PERF] stopRecording: FAILED in', Date.now() - startTime, 'ms');
      Alert.alert("خطأ", "فشل في إيقاف التسجيل.");
    }
    return null;
  };

  const playRecording = async (recording: Recording) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(recording.uri);
      if (!fileInfo.exists) {
        Alert.alert("خطأ", "لم يتم العثور على ملف التسجيل.");
        setRecordings(prev => prev.filter(r => r.id !== recording.id));
        return;
      }
      if (currentPlayingId === recording.id && playerStatus.playing) {
        audioPlayer.pause();
      } else {
        await audioPlayer.replace({ uri: recording.uri });
        await audioPlayer.play();
        setCurrentPlayingId(recording.id);
      }
    } catch (error) {
      console.error("Error playing recording:", error);
      Alert.alert("خطأ", "فشل في تشغيل التسجيل.");
    }
  };

  const deleteRecording = async (recordingId: string) => {
    const recording = recordings.find(r => r.id === recordingId);
    if (!recording) return;

    try {
      await FileSystem.deleteAsync(recording.uri);
      setRecordings(prev => prev.filter(r => r.id !== recordingId));
      if (currentPlayingId === recordingId) {
        audioPlayer.pause();
        setCurrentPlayingId(null);
      }
    } catch (error) {
      console.error("Error deleting recording:", error);
      Alert.alert("خطأ", "فشل في حذف التسجيل.");
        }
  };

  return {
    isRecording,
    hasPermission,
    recordingDuration,
    recordings,
    setRecordings,
    currentPlayingId,
    playerStatus,
    loadSavedRecordings,
    startRecording,
    stopRecording,
    playRecording,
    deleteRecording,
    requestPermission,
  };
};
