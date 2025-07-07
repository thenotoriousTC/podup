import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useState } from 'react';
import { usePlayer } from '@/providers/playerprovider';
import { usePodcasts } from '@/hooks/usePodcasts';
import { SearchBar } from '@/components/SearchBar';
import { PodcastsList } from '@/components/PodcastsList';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';

export default function DiscoverScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { podcast } = usePlayer();
  const { groupedPodcasts, isLoading, error, totalResults } = usePodcasts(searchQuery);

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState />;
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="auto" />
      
      <SearchBar 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        resultsCount={searchQuery.length > 0 ? totalResults : undefined}
      />
      
      <PodcastsList 
        groupedPodcasts={groupedPodcasts}
        searchQuery={searchQuery}
        onClearSearch={handleClearSearch}
        hasPlayerActive={!!podcast}
      />
    </View>
  );
}
