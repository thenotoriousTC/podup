import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Series } from '@/hooks/usePodcasts';
import { Ionicons } from '@expo/vector-icons';
import { StyledText } from './StyledText';

interface SeriesCardProps {
  series: Series & { episode_count: number };
  isOwner?: boolean;
  onDelete?: (seriesId: string) => void;
}

const SeriesCard: React.FC<SeriesCardProps> = ({ series, isOwner, onDelete }) => {
  const handleDeletePress = () => {
    if (onDelete) {
      onDelete(series.id);
    }
  };

  return (
    <View className="flex-row items-center mb-8 mr-4">
      <Link href={`/series/${series.id}`} asChild>
        <TouchableOpacity className="flex-1 flex-row items-center bg-white rounded-lg p-3 shadow-xl">
          <Image 
            source={{ uri: series.cover_art_url || 'https://via.placeholder.com/150' }} 
            className="w-20 h-20 rounded-lg" 
          />
          <View className="flex-1 ml-3 justify-center">
            <StyledText className="text-base font-semibold mb-1 text-right dark:text-black" numberOfLines={2}>
              {series.title}
            </StyledText>
            <StyledText className="text-sm text-gray-600 text-right">
              {series.episode_count} حلقات
            </StyledText>
          </View>
        </TouchableOpacity>
      </Link>
      {isOwner && (
        <TouchableOpacity onPress={handleDeletePress} className="p-2.5 ml-2.5 bg-red-100 rounded-full">
          <Ionicons name="trash-outline" size={24} color="red" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SeriesCard;