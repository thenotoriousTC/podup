import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  resultsCount?: number;
}

export const SearchBar = ({ searchQuery, onSearchChange, resultsCount }: SearchBarProps) => {
  const clearSearch = () => {
    onSearchChange('');
  };

  return (
    <View className="px-4 pt-12 pb-4 bg-white">
      <View className="relative">
        {/* Search Input */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 border border-gray-200 shadow-xl">
          <Ionicons 
            name="search" 
            size={20} 
            color="#9CA3AF" 
            className="mr-3"
          />
          <TextInput
            className="flex-1 text-gray-800 text-base ml-3"
            placeholder="بحث عن محتوى..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={onSearchChange}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={clearSearch}
              className="ml-2 p-1"
              activeOpacity={0.7}
            >
              <Ionicons 
                name="close-circle" 
                size={20} 
                color="#9CA3AF" 
              />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Search Results Count */}
        {searchQuery.length > 0 && typeof resultsCount === 'number' && (
          <Text className="text-sm text-gray-500 mt-2 px-1">
            {resultsCount} podcast{resultsCount !== 1 ? 's' : ''} مطابق
          </Text>
        )}
      </View>
    </View>
  );
};
