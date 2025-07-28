import { useState } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StyledText } from './StyledText';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  resultsCount?: number;
  onClear?: () => void;
}

export const SearchBar = ({ searchQuery, onSearchChange, resultsCount, onClear }: SearchBarProps) => {

  return (
    <View className="px-4 pt-12 pb-4 bg-white">
      <View className="relative">
        {/* Search Input */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 border border-gray-200 shadow-xl">
          <TextInput
            className="flex-1 text-gray-800 text-base mr-3"
            placeholder="بحث عن محتوى..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={onSearchChange}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Ionicons 
            name="search" 
            size={20} 
            color="#4F46E5" 
            className="ml-3"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={onClear}
              className="ml-2 p-1"
              activeOpacity={0.7}
            >
              <Ionicons 
                name="close-circle" 
                size={20} 
                color="#4F46E5" 
              />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Search Results Count */}
        {searchQuery.length > 0 && typeof resultsCount === 'number' && (
          <StyledText className="text-sm text-gray-500 mt-2 px-1">
            {resultsCount} بودكاست{resultsCount !== 1 ? 'ات' : ''} مطابقة
          </StyledText>
        )}
      </View>
    </View>
  );
};
