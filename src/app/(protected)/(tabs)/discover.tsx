import { StatusBar } from 'expo-status-bar';
import { 
  ActivityIndicator, 
  FlatList, 
  Image, 
  StyleSheet, 
  Text, 
  View, 
  TextInput,
  TouchableOpacity,
  ScrollView
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

  // Group podcasts by category and filter based on search query
  const groupedPodcasts = useMemo(() => {
    if (!data?.data) return [];
    let podcasts = data.data;

    if (searchQuery.trim()) {
      podcasts = podcasts.filter((podcast) =>
        podcast.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        podcast.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        podcast.author?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const grouped = podcasts.reduce((acc, podcast) => {
      const category = podcast.category || 'Mix';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(podcast);
      return acc;
    }, {});

    return Object.keys(grouped).map(category => ({
      title: category,
      data: grouped[category],
    }));
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
        <Text>خطأ في جلب المحتوى</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white ">
      <StatusBar style="auto" />
      
      {/* Search Bar Container */}
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
              {groupedPodcasts.reduce((acc, section) => acc + section.data.length, 0)} podcast{groupedPodcasts.reduce((acc, section) => acc + section.data.length, 0) !== 1 ? 's' : ''}         مطابق
            </Text>
          )}
        </View>
      </View>

      {/* Podcasts List */}
      <ScrollView className="flex-1 px-4 mb-24">
        {groupedPodcasts.length === 0 && searchQuery.length > 0 ? (
          <View className="flex-1 items-center justify-center mt-20">
            <Ionicons name="search" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 text-lg font-medium mt-4">
              لم يتم العثور على محتوى
            </Text>
            <Text className="text-gray-400 text-sm mt-2 text-center px-8">
              حاول تحسين كلمات البحث أو ابحث عن محتوى مختلف
            </Text>
            <TouchableOpacity 
              onPress={clearSearch}
              className="mt-4 bg-blue-500 px-6 py-3 rounded-lg"
              activeOpacity={0.8}
            >
              <Text className="text-white font-medium">مسح البحث</Text>
            </TouchableOpacity>
          </View>
        ) : (
          groupedPodcasts.map(section => (
            <View key={section.title} className="mb-8">
              <Text className="text-2xl font-bold text-gray-800 mb-4">{section.title}</Text>
              <FlatList
                data={section.data}
                renderItem={({ item }) => <DiscoveryPodcastListItem podcast={item} />}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 16 }}
              />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
