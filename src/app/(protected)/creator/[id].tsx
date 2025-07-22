import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import PodcastListItem from '../../../components/bookListItem';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const CreatorPage = () => {
    const { id } = useLocalSearchParams();
  const { user: currentUser } = useAuth();
  const [creator, setCreator] = useState<any>(null);
  const [podcasts, setPodcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreatorData = async () => {
      const creatorId = Array.isArray(id) ? id[0] : id;
      if (!creatorId || creatorId === 'undefined') return;

      setLoading(true);

      // Fetch creator profile
      const { data: creatorData, error: creatorError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', creatorId)
        .single();

      if (creatorError) {
        console.error('Error fetching creator profile:', creatorError);
      } else {
        setCreator(creatorData);
      }

      // Fetch creator's podcasts
      const { data: podcastData, error: podcastError } = await supabase
        .from('podcasts')
        .select('*')
        .eq('user_id', creatorId);

      if (podcastError) {
        console.error("Error fetching creator's podcasts:", podcastError);
      } else {
        setPodcasts(podcastData);
      }

      setLoading(false);
    };

        fetchCreatorData();
  }, [id]);

  const handleDelete = async (podcastId: string, imageUrl: string, audioUrl: string) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this podcast? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Step 1: Delete references from user-library
              const { error: libraryError } = await supabase
                .from('user-library')
                .delete()
                .eq('podcast_id', podcastId);

              if (libraryError) {
                throw libraryError;
              }

              // Step 2: Delete files from storage
              const filesToDelete = [];
              if (imageUrl) {
                const imageName = imageUrl.split('/').pop();
                if (imageName) filesToDelete.push(imageName);
              }
              if (audioUrl) {
                const audioName = audioUrl.split('/').pop();
                if (audioName) filesToDelete.push(audioName);
              }

              if (filesToDelete.length > 0) {
                const { error: storageError } = await supabase.storage
                  .from('podcasts')
                  .remove(filesToDelete);
                if (storageError) throw storageError;
              }

              // Step 3: Delete the podcast record itself
              const { error: dbError } = await supabase
                .from('podcasts')
                .delete()
                .eq('id', podcastId);

              if (dbError) throw dbError;

              setPodcasts(podcasts.filter((p) => p.id !== podcastId));
              Alert.alert('Success', 'Podcast deleted successfully.');
            } catch (error: any) {
              console.error('Error deleting podcast:', error);
              Alert.alert('Error', `Failed to delete podcast: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  if (!creator) {
    return <View style={styles.container}><Text>Creator not found.</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
       {/* Back Button */}
       <View >
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center p-2 w-20"
        >
          <Ionicons name="arrow-back" size={28} color="black" />
          <Text className="ml-2 text-base">Back</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.header}>
        <Image source={{ uri: creator.avatar_url || 'https://example.com/default-avatar.png' }} style={styles.avatar} />
        <Text style={styles.creatorName}>{creator.full_name || creator.username}</Text>
      </View>
      <Text style={styles.podcastsHeader}>Podcasts : </Text>
            <FlatList
        data={podcasts}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <PodcastListItem podcast={item} />
            </View>
            {currentUser?.id === creator.id && (
              <TouchableOpacity
                onPress={() => handleDelete(item.id, item.image_url, item.audio_url)}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={24} color="red" />
              </TouchableOpacity>
            )}
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  creatorName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  podcastsHeader: {
    paddingLeft:5,
    fontSize: 24,
        fontWeight: 'bold',
    marginBottom: 10,
  },
  deleteButton: {
    padding: 10,
    marginLeft: 10,
  },
});

export default CreatorPage;

