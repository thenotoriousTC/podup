import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet } from 'react-native';
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import PodcastListItem from '../../../components/bookListItem';

const CreatorPage = () => {
  const { id } = useLocalSearchParams();
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

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  if (!creator) {
    return <View style={styles.container}><Text>Creator not found.</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={{ uri: creator.avatar_url || 'https://example.com/default-avatar.png' }} style={styles.avatar} />
        <Text style={styles.creatorName}>{creator.full_name || creator.username}</Text>
      </View>
      <Text style={styles.podcastsHeader}>Podcasts by {creator.full_name || creator.username}</Text>
      <FlatList
        data={podcasts}
        renderItem={({ item }) => <PodcastListItem podcast={item} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default CreatorPage;

