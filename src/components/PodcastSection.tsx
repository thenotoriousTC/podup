import { View, Text, FlatList } from 'react-native';
import DiscoveryPodcastListItem from '@/components/discoveryBookListItem';

interface PodcastSectionProps {
  title: string;
  data: any[];
}

export const PodcastSection = ({ title, data }: PodcastSectionProps) => {
  return (
    <View className="mb-8">
      <Text className="text-2xl font-bold text-gray-800 mb-4">{title}</Text>
      <FlatList
        data={data}
        renderItem={({ item }) => <DiscoveryPodcastListItem podcast={item} />}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 16 }}
      />
    </View>
  );
};
