import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { usePlayer } from '@/providers/playerprovider';
import { usePodcasts } from '@/hooks/usePodcasts';
import { SearchBar } from '@/components/SearchBar';
import DiscoverContent from '@/components/DiscoverContent';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';

export default function DiscoverScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { discoverContent, isLoading, error, totalResults, refreshPodcasts } = usePodcasts(searchQuery);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('DiscoverScreen focused - refreshing podcasts');
      refreshPodcasts();
    }, [refreshPodcasts])
  );

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState onRetry={refreshPodcasts} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar style="auto" />
      
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        resultsCount={searchQuery.length > 0 ? totalResults : undefined}
        onClear={handleClearSearch}
      />
      
      <DiscoverContent content={discoverContent} />
    </View>
  );
}