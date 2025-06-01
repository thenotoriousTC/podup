import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioRecorder, RecordingPresets, AudioModule } from 'expo-audio';

export default function RecordingScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [savedRecordings, setSavedRecordings] = useState<string[]>([]);
  
  // Use the Expo Audio hook for recording
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  useEffect(() => {
    // Request microphone permissions
    const getPermissions = async () => {
      try {
        const status = await AudioModule.requestRecordingPermissionsAsync();
        setHasPermission(status.granted);
        if (!status.granted) {
          Alert.alert(
            "Permission Required", 
            "We need microphone access to record audio."
          );
        }
      } catch (error) {
        console.error("Error requesting permissions:", error);
        setHasPermission(false);
      }
    };
    
    getPermissions();
  }, []);

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

  const startRecording = async () => {
    try {
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
      Alert.alert("Error", "Failed to start recording");
    }
  };

  const stopRecording = async () => {
    try {
      await audioRecorder.stop();
      setIsRecording(false);
      
      if (audioRecorder.uri) {
        setSavedRecordings(prev => [...prev, audioRecorder.uri as string]);
        Alert.alert("Success", "Your recording has been saved!");
      }
    } catch (error) {
      console.error("Failed to stop recording:", error);
      Alert.alert("Error", "Failed to stop recording");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.statusText}>Requesting permissions...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="mic-off" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>Microphone permission denied</Text>
        <Text style={styles.errorSubtext}>Please enable microphone access in your device settings</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, isRecording && styles.recordingActive]}>
          <Ionicons 
            name={isRecording ? "radio" : "mic"} 
            size={64} 
            color={isRecording ? "#FF3B30" : "#007AFF"} 
          />
        </View>
        
        <Text style={styles.title}>
          {isRecording ? "Recording in progress" : "Ready to Record"}
        </Text>
        
        {isRecording && (
          <Text style={styles.durationText}>
            {formatTime(recordingDuration)}
          </Text>
        )}
        
        <Text style={styles.subtitle}>
          {isRecording 
            ? "Tap the button below when you're finished recording" 
            : "Record your podcasts and share them with the world"}
        </Text>

        <TouchableOpacity 
          style={[styles.recordButton, isRecording && styles.stopButton]} 
          onPress={isRecording ? stopRecording : startRecording}
        >
          <Text style={styles.recordButtonText}>
            {isRecording ? "Stop Recording" : "Start Recording"}
          </Text>
        </TouchableOpacity>
        
        {savedRecordings.length > 0 && (
          <Text style={styles.savedText}>
            {savedRecordings.length} recording{savedRecordings.length !== 1 ? 's' : ''} saved
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    padding: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  recordingActive: {
    backgroundColor: '#FFF5F5',
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 17,
    color: '#000000',
    opacity: 0.7,
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 24,
    marginBottom: 30,
  },
  durationText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 12,
  },
  recordButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginTop: 20,
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 16,
    color: '#000000',
    opacity: 0.7,
    textAlign: 'center',
    maxWidth: '80%',
  },
  statusText: {
    marginTop: 16,
    fontSize: 16,
    color: '#007AFF',
  },
  savedText: {
    marginTop: 24,
    fontSize: 16,
    color: '#007AFF',
  },
}); 