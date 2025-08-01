import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { usePodcasts, SeriesWithEpisodes } from '@/hooks/usePodcasts';
import { useAuth } from '@/providers/AuthProvider';
import { Database } from '@/lib/database.types';
import DiscoveryBookListItem from '@/components/discoveryBookListItem';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StyledText } from '@/components/StyledText';

type Podcast = Database['public']['Tables']['podcasts']['Row'];

export default function SeriesDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getSeriesById } = usePodcasts('');
  const { user } = useAuth();
  const router = useRouter();

  const [series, setSeries] = useState<SeriesWithEpisodes | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSeries = async () => {
      if (!id) return;
      setIsLoading(true);
      const seriesData = await getSeriesById(id);
      setSeries(seriesData);
      setIsLoading(false);
    };
    fetchSeries();
  }, [id]);

  if (isLoading || !series) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <ScrollView>
        <View style={styles.headerContainer}>
          <Image source={{ uri: series.cover_art_url || undefined }} style={styles.coverArt} />
          <StyledText style={styles.title}>{series.title}</StyledText>
          <StyledText style={styles.episodeCount}>{series.episode_count} حلقات</StyledText>
          <StyledText style={styles.description}>{series.description}</StyledText>
          {user?.id === series.creator_id && (
            <TouchableOpacity 
              style={styles.addEpisodesButton}
              className='bg-indigo-600'
              onPress={() => router.push(`/creator/manage-series-episodes/${id}`)} >
              <StyledText style={styles.addEpisodesButtonText}>إضافة حلقات</StyledText>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.episodesContainer}>
          <StyledText style={styles.episodesTitle}>الحلقات</StyledText>
          {series.episodes.map((episode) => (
            <DiscoveryBookListItem key={episode.id} podcast={episode} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  headerContainer: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 60, // Add padding to avoid overlap with back button
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  coverArt: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'semibold',
    textAlign: 'center',
    marginBottom: 8,
  },
  episodeCount: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  episodesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  episodesTitle: {
    fontSize: 20,
    fontWeight: 'semibold',
    marginBottom: 8,
    textAlign: 'right',
  },
  addEpisodesButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addEpisodesButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'semibold',
  },
});
