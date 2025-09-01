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
    AudioModule.requestRecordingPermissionsAsync().then(status => {
      setHasPermission(status.granted);
      if (!status.granted) {
        Alert.alert("يجب الحصول على إذن", "يجب الحصول على إذن الميكروفون لتسجيل الصوت.");
      }
    });
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRecording) {
      interval = setInterval(() => setRecordingDuration(prev => prev + 1), 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  useEffect(() => {
    if (!playerStatus.playing) {
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
    try {
      const dirExists = await FileSystem.getInfoAsync(RECORDINGS_DIR);
      if (!dirExists.exists) {
        await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, { intermediates: true });
        return;
      }
      const files = await FileSystem.readDirectoryAsync(RECORDINGS_DIR);
      const loadedRecordings: Recording[] = [];
      for (const file of files.filter(f => f.endsWith('.m4a'))) {
        const parts = file.split('_');
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
      setRecordings(loadedRecordings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (error) {
      console.error('Error loading recordings:', error);
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
    try {
      await audioRecorder.stop();
      setIsRecording(false);
      const uri = audioRecorder.uri;
      if (uri) {
        // Ensure directory exists
        const dirInfo = await FileSystem.getInfoAsync(RECORDINGS_DIR);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, { intermediates: true });
        }
        
        const timestamp = Date.now();
        const fileName = `${currentUser?.id}_recording_${timestamp}.m4a`;
        const permanentUri = RECORDINGS_DIR + fileName;
        await FileSystem.copyAsync({ from: uri, to: permanentUri });
        const newRecording: Recording = {
          id: fileName.replace('.m4a', ''),
          uri: permanentUri,
          title: `تسجيل ${recordings.length + 1}`,
          duration: recordingDuration,
          createdAt: new Date(timestamp)
        };
        setRecordings(prev => [newRecording, ...prev]);
        return newRecording;
      }
    } catch (error) {
      console.error("Failed to stop recording:", error);
      Alert.alert("خطأ", "فشل في إيقاف التسجيل.");
    }
    return null;
  };

  const playRecording = async (recording: Recording) => {
    try {
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
  };
};
