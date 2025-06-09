import { StatusBar } from 'expo-status-bar';
import { 
  ActivityIndicator, 
  FlatList, 
  Image, 
  StyleSheet, 
  Text, 
  View, 
  TextInput,
  TouchableOpacity
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import DiscoveryPodcastListItem from '@/components/discoveryBookListItem';
import { supabase } from '@/lib/supabase';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['podcasts'],
    queryFn: async () => supabase.from('podcasts').select('*').throwOnError(),
  });

  const queryClient = useQueryClient();

  // Filter podcasts based on search query
  const filteredPodcasts = useMemo(() => {
    if (!data?.data) return [];
    if (!searchQuery.trim()) return data.data;
    
    return data.data.filter((podcast) =>
      podcast.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      podcast.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      podcast.author?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data?.data, searchQuery]);

  const clearSearch = () => {
    setSearchQuery('');
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center p-4 pt-12">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-4 pt-12">
        <Text>Error fetching podcasts</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="auto" />
      
      {/* Search Bar Container */}
      <View className="px-4 pt-12 pb-4 bg-white shadow-sm">
        <View className="relative">
          {/* Search Input */}
          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 border border-gray-200">
            <Ionicons 
              name="search" 
              size={20} 
              color="#9CA3AF" 
              className="mr-3"
            />
            <TextInput
              className="flex-1 text-gray-800 text-base ml-3"
              placeholder="Search podcasts..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
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
          {searchQuery.length > 0 && (
            <Text className="text-sm text-gray-500 mt-2 px-1">
              {filteredPodcasts.length} podcast{filteredPodcasts.length !== 1 ? 's' : ''} found
            </Text>
          )}
        </View>
      </View>

      {/* Podcasts List */}
      <View className="flex-1 px-4">
        {filteredPodcasts.length === 0 && searchQuery.length > 0 ? (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="search" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 text-lg font-medium mt-4">
              No podcasts found
            </Text>
            <Text className="text-gray-400 text-sm mt-2 text-center px-8">
              Try adjusting your search terms or browse all podcasts
            </Text>
            <TouchableOpacity 
              onPress={clearSearch}
              className="mt-4 bg-blue-500 px-6 py-3 rounded-lg"
              activeOpacity={0.8}
            >
              <Text className="text-white font-medium">Clear Search</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredPodcasts}
            contentContainerClassName="gap-4 pb-6"
            renderItem={({ item }) => <DiscoveryPodcastListItem podcast={item} />}
            keyExtractor={(item) => item.id}
            className="w-full"
            contentContainerStyle={{ gap: 16, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
    </View>
  );
}