import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Series } from '@/hooks/usePodcasts'; // We'll need to export this type
import { StyledText } from './StyledText';

interface SeriesCardProps {
  series: Series & { episode_count: number };
}

const SeriesCard: React.FC<SeriesCardProps> = ({ series }) => {
  return (
    <Link href={`/series/${series.id}`} asChild>
      <TouchableOpacity className="flex-row items-center bg-white rounded-lg p-3  shadow-xl mb-8 mr-8">
        <Image 
          source={{ uri: series.cover_art_url || 'https://via.placeholder.com/150' }} 
          className="w-20 h-20 rounded-lg " 
        />
        <View className="flex-1 ml-3 justify-center">
          <StyledText className="text-base font-semibold mb-1 text-right" numberOfLines={2}>
            {series.title}
          </StyledText>
          <StyledText className="text-sm text-gray-600 text-right">
            {series.episode_count} حلقات
          </StyledText>
        </View>
      </TouchableOpacity>
    </Link>
  );
};

export default SeriesCard;