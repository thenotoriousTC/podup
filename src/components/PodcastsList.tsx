import { ScrollView } from 'react-native';
import { PodcastSection } from './PodcastSection';
import { EmptySearchResults } from './EmptySearchResults';

interface PodcastsListProps {
  groupedPodcasts: Array<{ title: string; data: any[] }>;
  searchQuery: string;
  onClearSearch: () => void;
  hasPlayerActive: boolean;
}

export const PodcastsList = ({ 
  groupedPodcasts, 
  searchQuery, 
  onClearSearch, 
  hasPlayerActive 
}: PodcastsListProps) => {
  const showEmptyState = groupedPodcasts.length === 0 && searchQuery.length > 0;

  return (
    <ScrollView className={`flex-1 px-4 ${hasPlayerActive ? 'mb-24' : 'mb-2'}`}>
      {showEmptyState ? (
        <EmptySearchResults onClearSearch={onClearSearch} />
      ) : (
        groupedPodcasts.map(section => (
          <PodcastSection 
            key={section.title}
            title={section.title}
            data={section.data}
          />
        ))
      )}
    </ScrollView>
  );
};
