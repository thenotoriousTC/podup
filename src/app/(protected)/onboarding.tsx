import { View, Text, Pressable, ScrollView, TextInput, Image, Alert, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { MaterialIcons } from '@expo/vector-icons';

// Re-using categories from UPLOAD.tsx
const categories = [
  'كوميدي', 'مال', 'ترفيه', 'تكنولوجيا', 'علوم', 'رياضة',
  'أخبار', 'صحة', 'Business', 'تعليم', 'فن', 'تاريخ',
];

const OnboardingScreen = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState('');
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        setFullName(user.user_metadata?.full_name || '');
      }
    };
    fetchUser();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access the photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatarImage(result.assets[0].uri);
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const base64ToArrayBuffer = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Full Name Required', 'Please enter your full name.');
      return;
    }
    if (selectedInterests.length === 0) {
      Alert.alert('Interests Required', 'Please select at least one interest.');
      return;
    }
    if (!currentUser) {
        Alert.alert('Error', 'Could not identify user. Please try logging in again.');
        return;
    }

    setIsSaving(true);
    let avatarUrl: string | undefined = undefined;

    try {
      // 1. Upload avatar if a new one is picked
      if (avatarImage) {
        const imageData = await FileSystem.readAsStringAsync(avatarImage, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const imageFileName = `avatar_${currentUser.id}_${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(imageFileName, base64ToArrayBuffer(imageData), {
            contentType: 'image/jpeg',
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(imageFileName);
        avatarUrl = urlData.publicUrl;
      }

      // 2. Update the user's profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          interests: selectedInterests,
          ...(avatarUrl && { avatar_url: avatarUrl }),
        })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      Alert.alert('Profile Saved!', 'Your profile has been updated successfully.');
      router.replace('/'); // Navigate to home screen

    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Save Failed', error.message || 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Stack.Screen options={{ title: 'Set Up Your Profile' }} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Welcome!</Text>
        <Text style={styles.subtitle}>Let's get your profile set up.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Picture</Text>
        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer} disabled={isSaving}>
          {avatarImage ? (
            <Image source={{ uri: avatarImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialIcons name="add-a-photo" size={40} color="#ccc" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Full Name</Text>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter your full name"
          style={styles.input}
          editable={!isSaving}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Interests</Text>
        <Text style={styles.sectionSubtitle}>Select a few topics you enjoy.</Text>
        <View style={styles.interestsContainer}>
          {categories.map(interest => (
            <TouchableOpacity
              key={interest}
              style={[styles.interestChip, selectedInterests.includes(interest) && styles.interestChipSelected]}
              onPress={() => toggleInterest(interest)}
              disabled={isSaving}
            >
              <Text style={[styles.interestText, selectedInterests.includes(interest) && styles.interestTextSelected]}>
                {interest}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Pressable onPress={handleSave} style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} disabled={isSaving}>
        {isSaving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save & Continue</Text>
        )}
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  contentContainer: { padding: 20 },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 4 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#444', marginBottom: 10 },
  sectionSubtitle: { fontSize: 14, color: '#777', marginBottom: 15 },
  avatarContainer: { alignSelf: 'center' },
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#e9ecef' },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#e9ecef', justifyContent: 'center', alignItems: 'center' },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
  interestsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  interestChip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
  interestChipSelected: { backgroundColor: '#007bff', borderColor: '#007bff' },
  interestText: { color: '#333' },
  interestTextSelected: { color: '#fff' },
  saveButton: { backgroundColor: '#007bff', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  saveButtonDisabled: { backgroundColor: '#a0cfff' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default OnboardingScreen;
