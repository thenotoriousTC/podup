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
    <ScrollView
      className="flex-1 px-4"
      contentContainerStyle={{ paddingBottom: hasPlayerActive ? 96 : 8 }}
      keyboardShouldPersistTaps="handled"
    >
      {showEmptyState ? (
        <EmptySearchResults onClearSearch={onClearSearch} />
      ) : (
        groupedPodcasts.map((section, index) => (
          <PodcastSection 
            key={`${section.title}-${index}`}
            title={section.title}
            data={section.data}
          />
        ))
      )}
    </ScrollView>
  );
};
