import { View, FlatList } from 'react-native';
import DiscoveryPodcastListItem from '@/components/discoveryBookListItem';
import { StyledText } from './StyledText';
import { Database } from '@/lib/database.types';

type Podcast = Database['public']['Tables']['podcasts']['Row'];

interface PodcastSectionProps {
  title: string;
  data: Podcast[];
  onToggleLibrary?: (podcast: Podcast) => void;
}

export const PodcastSection = ({ title, data, onToggleLibrary }: PodcastSectionProps) => {
  return (
    <View className="mb-8">
      <View className="flex-row justify-between items-center mb-4">
        <StyledText className="text-sm text-gray-500">إسحب للمزيد ←</StyledText>
        <StyledText fontWeight="Bold" className="text-3xl font-semibold text-gray-800 ">{title}</StyledText>
      </View>
      <FlatList<Podcast>
        data={data}
        renderItem={({ item }) => (
          <DiscoveryPodcastListItem 
            podcast={item} 
            isInLibrary={false}
            onToggleLibrary={() => onToggleLibrary?.(item)}
            isTogglingLibrary={false}
          />
        )}
        keyExtractor={(item) => String(item.id)}
        horizontal
        inverted
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 16 }}
      />
    </View>
  );
};
