import { View } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { usePodcasts } from '@/hooks/usePodcasts';
import { SearchBar } from '@/components/SearchBar';
import DiscoverContent from '@/components/DiscoverContent';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import SponsorCarousel from '@/components/SponsorCarousel';

export default function DiscoverScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const { discoverContent, isLoading, error, totalResults, refreshPodcasts } = usePodcasts(debouncedSearchQuery);

  // Debounce search query to prevent state reset on each keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // Increased to 500ms for more stability

    return () => clearTimeout(timer);
  }, [searchQuery]);


  console.log(' DiscoverScreen render:', {
    searchQuery,
    debouncedSearchQuery,
    discoverContentLength: discoverContent?.length,
    isLoading,
    error: error?.message,
    totalResults
  });

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
      
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        resultsCount={debouncedSearchQuery.length > 0 ? totalResults : undefined}
        onClear={handleClearSearch}
      />
      
      <SponsorCarousel />
      
      <DiscoverContent content={discoverContent} />
    </View>
  );
}