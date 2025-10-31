import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, Animated } from 'react-native';
import { TouchableOpacity } from '@/components/TouchableOpacity';
import { LinearGradient } from 'expo-linear-gradient';
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
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

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

  useEffect(() => {
    if (!isLoading && series) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading, series]);

  const isFollowing = followStatus ? followStatus[id] : false;

  if (error) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center p-5 bg-white">
        <StyledText className="text-red-500 text-center text-lg mb-4">{error}</StyledText>
        <TouchableOpacity 
          onPress={fetchSeries}
          className="py-2.5 px-5 rounded-lg bg-[#FD842B]"
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
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#FD842B" />
        <StyledText className="mt-4 text-gray-500" fontWeight="Medium">
          جاري التحميل...
        </StyledText>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Navigation Header */}
      <View className="flex-row items-center justify-center px-4 py-3 border-b border-gray-100">
        <TouchableOpacity 
          className="absolute left-4 bg-gray-100 p-2.5 rounded-full"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>
        <StyledText className="text-lg text-black" fontWeight="SemiBold">
          تفاصيل السلسلة
        </StyledText>
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View 
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Hero Section */}
          <View className="items-center px-6 pt-8 pb-6">
            {/* Podcast Cover with Shadow */}
            <View style={styles.coverContainer}>
              <Image 
                source={{ uri: series.cover_art_url || undefined }} 
                className="w-full h-full"
                style={styles.coverImage}
              />
            </View>

            {/* Title */}
            <StyledText 
              className="text-3xl text-center mt-6 mb-2 text-black"
              fontWeight="Bold"
              style={styles.title}
            >
              {series.title}
            </StyledText>

            {/* Episode Count */}
            <View className="flex-row items-center mb-4">
              <Ionicons name="albums-outline" size={16} color="#8E8E93" />
              <StyledText className="text-base text-gray-500 mr-1.5" fontWeight="Medium">
                {series.episode_count} حلقات
              </StyledText>
            </View>

            {/* Description */}
            {series.description && (
              <StyledText 
                className="text-base text-gray-700 text-center leading-6 mb-6 px-2"
                fontWeight="Regular"
                style={styles.description}
              >
                {series.description}
              </StyledText>
            )}

            {/* Action Button */}
            {user?.id === series.creator_id ? (
              <TouchableOpacity 
                className="mt-2"
                onPress={() => router.push(`/creator/manage-series-episodes/${id}`)} 
                style={styles.actionButton}
              >
                <LinearGradient
                  colors={['#FD842B', '#FF9A4D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#fff" />
                  <StyledText className="text-white text-base mr-2" fontWeight="SemiBold">
                    إضافة حلقات
                  </StyledText>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View className="mt-2" style={styles.followButtonContainer}>
                <FollowButton
                  isFollowing={isFollowing}
                  followersCount={followersCount || 0}
                  onPress={toggleFollow}
                  isToggling={isToggling}
                />
              </View>
            )}
          </View>

          {/* Episodes Section */}
          <View className="px-5 pb-6 mt-4">
            <View className="flex-row items-center justify-between mb-4">
                 <View className="bg-gray-100 px-3 py-1.5 rounded-full">
                <StyledText className="text-sm text-gray-600" fontWeight="Medium">
                  {series.episodes.length}
                </StyledText>
              </View>
              <StyledText className="text-2xl text-black" fontWeight="Bold">
                الحلقات
              </StyledText>
           
            </View>
         
            {series.episodes.map((episode, index) => {
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
                <Animated.View
                  key={episode.id}
                  style={[
                    styles.episodeCard,
                    {
                      opacity: fadeAnim,
                      transform: [
                        {
                          translateY: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20 + index * 5, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <DiscoveryBookListItem
                    podcast={episode}
                    isInLibrary={isInLibrary}
                    onToggleLibrary={onToggleLibrary}
                    isTogglingLibrary={libraryMutation.isPending}
                  />
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
  },
  backButton: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  coverContainer: {
    width: 240,
    height: 240,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    backgroundColor: '#fff',
  },
  coverImage: {
    borderRadius: 20,
    resizeMode: 'cover',
  },
  title: {
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  description: {
    lineHeight: 24,
    maxWidth: 340,
  },
  actionButton: {
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#FD842B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 28,
  },
  followButtonContainer: {
    minWidth: 160,
  },
  episodeCard: {
    marginBottom: 12,
  },
});