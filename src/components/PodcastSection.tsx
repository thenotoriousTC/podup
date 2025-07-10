import { View, Text, FlatList } from 'react-native';
import DiscoveryPodcastListItem from '@/components/discoveryBookListItem';

interface PodcastSectionProps {
  title: string;
  data: any[];
}

export const PodcastSection = ({ title, data }: PodcastSectionProps) => {
  return (
    <View className="mb-8">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-2xl font-bold text-gray-800">{title}</Text>
        <Text className="text-sm text-gray-500">Scroll for more →</Text>
      </View>
      <FlatList
        data={data}
        renderItem={({ item }) => <DiscoveryPodcastListItem podcast={item} />}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={{ gap: 16 }}
      />
    </View>
  );
};
