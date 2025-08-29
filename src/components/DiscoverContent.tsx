import React, { useMemo } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DiscoverContent as DiscoverContentType } from '@/hooks/usePodcasts';
import SeriesCard from './SeriesCard';
import DiscoveryPodcastListItem from './discoveryBookListItem';
import { StyledText } from './StyledText';
import { useAuth } from '@/providers/AuthProvider';
import { useLibraryStatus, useLibraryMutation } from '@/hooks/useLibraryStatus';

interface DiscoverContentProps {
  content: DiscoverContentType[];
}

const DiscoverContent: React.FC<DiscoverContentProps> = ({ content }) => {
  const { user: currentUser } = useAuth();

  const podcastIds = useMemo(() => {
    return content
      .filter((item) => item.type === 'podcasts')
      .flatMap((item) => (item.data as any[]).map((podcast) => podcast.id));
  }, [content]);

  const { libraryStatus, isLoading: isLibraryStatusLoading } = useLibraryStatus(
    currentUser?.id,
    podcastIds
  );

  const libraryMutation = useLibraryMutation();

  const renderItem = ({ item }: { item: DiscoverContentType }) => {
    if (item.type === 'series') {
      return (
        <View style={styles.sectionContainer}>
          <StyledText style={styles.sectionTitle}>{item.title}</StyledText>
          <FlatList
            data={item.data}
            renderItem={({ item: seriesItem }) => <SeriesCard series={seriesItem} />}
            keyExtractor={(seriesItem) => seriesItem.id.toString()}
            horizontal
            inverted
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>
      );
    }

    if (item.type === 'podcasts') {
      return (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.scrollIndicator}>
              <StyledText style={styles.scrollIndicatorText}>مرر للمزيد</StyledText>
              <Ionicons name="arrow-back" size={16} color="#8E8E93" />
            </View>
            <StyledText style={styles.sectionTitle}>{item.title}</StyledText>
          </View>
          <FlatList
            data={item.data}
            renderItem={({ item: podcast }) => {
              const isInLibrary = libraryStatus ? libraryStatus[podcast.id] : false;
              const onToggleLibrary = () => {
                if (!currentUser) return;
                libraryMutation.mutate({
                  podcastId: podcast.id,
                  userId: currentUser.id,
                  isInLibrary,
                });
              };

              return (
                <DiscoveryPodcastListItem
                  podcast={podcast}
                  isInLibrary={isInLibrary}
                  onToggleLibrary={onToggleLibrary}
                  isTogglingLibrary={libraryMutation.isPending}
                />
              );
            }}
            keyExtractor={(podcast) => podcast.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            inverted // Flips the list to scroll from right to left
          />
        </View>
      );
    }

    return null;
  };

  return (
    <FlatList
      data={content}
      renderItem={renderItem}
      keyExtractor={(item, index) => `${item.type}-${index}`}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color:'black',
    fontSize: 22,
    fontWeight: 'semibold',
    textAlign: 'right',
  },
  scrollIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.7,
  },
  scrollIndicatorText: {
    color: '#8E8E93',
    fontSize: 14,
    marginRight: 4,
  },
  horizontalList: {
    paddingHorizontal: 16,
  },
});

export default DiscoverContent;
