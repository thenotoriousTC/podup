import React, { useMemo } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DiscoverContent as DiscoverContentType } from '@/hooks/usePodcasts';
import SeriesCard from './SeriesCard';
import DiscoveryPodcastListItem from './discoveryBookListItem';
import { StyledText } from './StyledText';
import { useAuth } from '@/providers/AuthProvider';
import { useLibraryStatus, useLibraryMutation } from '@/hooks/useLibraryStatus';
import SponsorCarousel from './SponsorCarousel';

interface DiscoverContentProps {
  content: DiscoverContentType[];
}

const DiscoverContent: React.FC<DiscoverContentProps> = ({ content }) => {
  const { user: currentUser } = useAuth();

  const podcastIds = useMemo(() => {
    return content
      .filter((item) => item.type === 'podcasts')
      .flatMap((item) => item.data.map((podcast: { id: string }) => podcast.id));
  }, [content]);

  const { libraryStatus, isLoading: isLibraryStatusLoading } = useLibraryStatus(
    currentUser?.id || '',
    podcastIds
  );

  const libraryMutation = useLibraryMutation();
  
  console.log('🏗️ DiscoverContent render:', {
    contentLength: content.length,
    podcastIds: podcastIds.length,
    currentUserId: currentUser?.id,
    isLibraryStatusLoading,
    libraryStatusKeys: libraryStatus ? Object.keys(libraryStatus) : 'null',
    mutationPending: libraryMutation.isPending
  });

  const renderItem = ({ item }: { item: DiscoverContentType }) => {
    console.log('🔍 DiscoverContent renderItem:', { type: item.type, title: item.title, dataLength: item.data?.length });
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
            initialNumToRender={3}
            maxToRenderPerBatch={2}
            windowSize={5}
            removeClippedSubviews={true}
            getItemLayout={(data, index) => ({
              length: 200, // Approximate width of SeriesCard
              offset: 200 * index,
              index,
            })}
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
              console.log('📱 Podcast render:', { 
                podcastId: podcast.id, 
                podcastTitle: podcast.title,
                isInLibrary, 
                libraryStatus: libraryStatus ? Object.keys(libraryStatus).length : 'null',
                currentUserId: currentUser?.id 
              });
              
              const onToggleLibrary = () => {
                console.log('❤️ Heart pressed:', { 
                  podcastId: podcast.id, 
                  userId: currentUser?.id, 
                  currentIsInLibrary: isInLibrary,
                  willBeInLibrary: !isInLibrary,
                  mutationPending: libraryMutation.isPending
                });
                
                if (!currentUser) {
                  console.log('❌ No current user for heart press');
                  return;
                }
                
                libraryMutation.mutate({
                  podcastId: podcast.id,
                  userId: currentUser.id,
                  isInLibrary: isInLibrary, // Pass current state, mutation will handle the logic
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
            initialNumToRender={4}
            maxToRenderPerBatch={3}
            windowSize={7}
            removeClippedSubviews={true}
            getItemLayout={(data, index) => ({
              length: 180, // Approximate width of DiscoveryPodcastListItem
              offset: 180 * index,
              index,
            })}
          />
        </View>
      );
    }

    return null;
  };

  return (  
   <View style={{flex:1}}>
     <FlatList
      data={content}
      renderItem={renderItem}
      keyExtractor={(item, index) => `${item.type}-${index}`}
      ListHeaderComponent={<SponsorCarousel />}
      contentContainerStyle={styles.container}
    />
   
</View>
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
    fontWeight: '600',
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
