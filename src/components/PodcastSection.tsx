import { View, FlatList } from 'react-native';
import DiscoveryPodcastListItem from '@/components/discoveryBookListItem';
import { StyledText } from './StyledText';

interface PodcastSectionProps {
  title: string;
  data: any[];
}

export const PodcastSection = ({ title, data }: PodcastSectionProps) => {
  return (
    <View className="mb-8">
      <View className="flex-row justify-between items-center mb-4">
        <StyledText className="text-sm text-gray-500">إسحب للمزيد ←</StyledText>
        <StyledText fontWeight="Bold" className="text-3xl font-bold text-gray-800 ">{title}</StyledText>
      </View>
      <FlatList
        data={data}
        renderItem={({ item }) => <DiscoveryPodcastListItem podcast={item} />}
        keyExtractor={(item) => item.id}
        horizontal
        inverted
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 16 }}
      />
    </View>
  );
};
