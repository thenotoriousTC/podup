import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { usePodcasts, SeriesWithEpisodes } from '@/hooks/usePodcasts';
import { useAuth } from '@/providers/AuthProvider';
import { Database } from '@/lib/database.types';
import DiscoveryBookListItem from '@/components/discoveryBookListItem';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StyledText } from '@/components/StyledText';
import { FollowButton } from '@/components/FollowButton';
import { useSeriesFollows } from '@/hooks/useSeriesFollows';
import { useFollow } from '@/hooks/useFollow';
import { useLibraryStatus, useLibraryMutation } from '@/hooks/useLibraryStatus';

type Podcast = Database['public']['Tables']['podcasts']['Row'];

export default function SeriesDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Use the follow hook for both data fetching and mutations
  const { user } = useAuth();
  const { followStatus, isLoading: isFollowStatusLoading } = useSeriesFollows(
    user?.id,
    id ? [id] : []
  );

  const { 
    toggleFollow, 
    isToggling, 
    followersCount, 
    isLoading: isFollowMutationLoading 
  } = useFollow({
    userId: user?.id,
    seriesId: id,
  });
  const { getSeriesById } = usePodcasts('');
  const [series, setSeries] = useState<SeriesWithEpisodes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const episodeIds = useMemo(() => {
    return series?.episodes.map((episode) => episode.id) || [];
  }, [series]);

  const { libraryStatus, isLoading: isLibraryStatusLoading } = useLibraryStatus(
    user?.id,
    episodeIds
  );

  const libraryMutation = useLibraryMutation();
  const router = useRouter();

  

  const fetchSeries = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const seriesData = await getSeriesById(id);
      if (!seriesData) {
        throw new Error('لم يتم العثور على السلسلة.');
      }
      setSeries(seriesData);
    } catch (err) {
      console.error('Failed to fetch series:', err);
      setError(err instanceof Error ? err.message : 'فشل تحميل السلسلة. الرجاء المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSeries();
  }, [id, getSeriesById]);

  const isFollowing = followStatus ? followStatus[id] : false;

  if (error) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center p-5 bg-white">
        <StyledText className="text-red-500 text-center text-lg mb-4">{error}</StyledText>
        <TouchableOpacity 
          onPress={fetchSeries}
          className="py-2.5 px-5 rounded-lg bg-indigo-600"
        >
          <StyledText className="text-white text-base font-semibold">
            حاول مرة أخرى
          </StyledText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (isLoading || isFollowStatusLoading || isLibraryStatusLoading || !series) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <TouchableOpacity 
        className="absolute top-5 left-5 bg-black/50 p-2 rounded-full z-10"
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <ScrollView>
           
             <View className="items-center p-5 pt-16 ">
              
             <Image 
            source={{ uri: series.cover_art_url || undefined }} 
            className="w-64 h-64 rounded-lg mb-4"
          />
          <StyledText className="text-3xl font-semibold text-center mb-2 text-indigo-600 dark:text-indigo-600">
            {series.title}
          </StyledText>
          <StyledText className="text-base text-gray-500 mb-3 dark:text-gray-500">
            {series.episode_count} حلقات
          </StyledText>
          <StyledText className="text-base text-gray-800 text-center dark:text-gray-800">
            {series.description}
          </StyledText>
          {user?.id === series.creator_id ? (
            <TouchableOpacity 
              className="mt-4 py-2.5 px-5 rounded-lg bg-indigo-600"
              onPress={() => router.push(`/creator/manage-series-episodes/${id}`)} 
            >
              <StyledText className="text-white text-base font-semibold dark:text-white">
                إضافة حلقات
              </StyledText>
            </TouchableOpacity>
          ) : (
            <View className="mt-4">
              <FollowButton
                isFollowing={isFollowing}
                followersCount={followersCount || 0}
                onPress={toggleFollow}
                isToggling={isToggling}
              />
            </View>
          )}
        </View>

        <View className="px-4 pb-4">
          <StyledText className="text-xl font-semibold mb-2 text-right text-black">
            الحلقات
          </StyledText>
       
          {series.episodes.map((episode) => {
            const isInLibrary = libraryStatus ? libraryStatus[episode.id] : false;
            const onToggleLibrary = () => {
              if (!user) return;
              libraryMutation.mutate({
                podcastId: episode.id,
                userId: user.id,
                isInLibrary,
              });
            };
            return (
              <DiscoveryBookListItem
                key={episode.id}
                podcast={episode}
                isInLibrary={isInLibrary}
                onToggleLibrary={onToggleLibrary}
                isTogglingLibrary={libraryMutation.isPending}
              />
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}