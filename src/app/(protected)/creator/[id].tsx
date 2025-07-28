import { View, Text, FlatList, Image, ActivityIndicator, Alert, TouchableOpacity, ScrollView } from 'react-native';
import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import PodcastListItem from '../../../components/bookListItem';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePodcasts, Series } from '@/hooks/usePodcasts';
import SeriesCard from '@/components/SeriesCard';
import { StyledText } from '@/components/StyledText';

const CreatorPage = () => {
    const { id } = useLocalSearchParams();
  const { user: currentUser } = useAuth();
  const { getSeriesByCreatorId } = usePodcasts('');
  const [creator, setCreator] = useState<any>(null);
  const [podcasts, setPodcasts] = useState<any[]>([]);
  const [series, setSeries] = useState<(Series & { episode_count: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreatorData = async () => {
      const creatorId = Array.isArray(id) ? id[0] : id;
      if (!creatorId || creatorId === 'undefined') return;

      setLoading(true);

      // Fetch creator profile
      const { data: creatorData, error: creatorError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', creatorId)
        .single();

      if (creatorError) {
        console.error('Error fetching creator profile:', creatorError);
      } else {
        setCreator(creatorData);
      }

      // Fetch creator's podcasts
      const { data: podcastData, error: podcastError } = await supabase
        .from('podcasts')
        .select('*')
        .eq('user_id', creatorId);

      if (podcastError) {
        console.error("Error fetching creator's podcasts:", podcastError);
      } else {
        setPodcasts(podcastData);
      }

      // Fetch creator's series
      const seriesData = await getSeriesByCreatorId(creatorId);
      setSeries(seriesData);

      setLoading(false);
    };

        fetchCreatorData();
  }, [id]);

  const handleDelete = async (podcastId: string, imageUrl: string, audioUrl: string) => {
    Alert.alert(
      'يرجى تأكيد الحذف',
      'هل انت متأكد من حذف البودكاست؟ هذه الخطوة لا يمكن التراجع عنها.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Step 1: Delete references from user-library
              const { error: libraryError } = await supabase
                .from('user-library')
                .delete()
                .eq('podcast_id', podcastId);

              if (libraryError) {
                throw libraryError;
              }

              // Step 2: Delete files from storage
              const filesToDelete = [];
              if (imageUrl) {
                const imageName = imageUrl.split('/').pop();
                if (imageName) filesToDelete.push(imageName);
              }
              if (audioUrl) {
                const audioName = audioUrl.split('/').pop();
                if (audioName) filesToDelete.push(audioName);
              }

              if (filesToDelete.length > 0) {
                const { error: storageError } = await supabase.storage
                  .from('podcasts')
                  .remove(filesToDelete);
                if (storageError) throw storageError;
              }

              // Step 3: Delete the podcast record itself
              const { error: dbError } = await supabase
                .from('podcasts')
                .delete()
                .eq('id', podcastId);

              if (dbError) throw dbError;

              setPodcasts(podcasts.filter((p) => p.id !== podcastId));
              Alert.alert('تم الحذف', 'تم حذف البودكاست بنجاح.');
            } catch (error: any) {
              console.error('Error deleting podcast:', error);
              Alert.alert('خطأ', `فشل حذف البودكاست: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" className="flex-1 justify-center" />;
  }

  if (!creator) {
    return <View className="flex-1 p-2.5 pt-12 bg-white"><StyledText>لم يتم العثور على المبدع</StyledText></View>;
  }

  const isOwnProfile = currentUser?.id === creator.id;

  return (
    <SafeAreaView className="flex-1 p-2.5 pt-12 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
       {/* Back Button */}
       <View >
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center p-2 w-20"
        >
          <Ionicons name="arrow-back" size={28} color="black" />
        </TouchableOpacity>
      </View>
      <View className="items-center mb-5">
        <Image source={{ uri: creator.avatar_url || 'https://example.com/default-avatar.png' }} className="w-40 h-40 rounded-full mb-8" />
        <StyledText className="text-2xl font-semibold">{creator.full_name || creator.username}</StyledText>
      </View>

      {series.length > 0 && (
        <View className="mb-5">
          <StyledText className="pl-1 text-2xl font-semibold mb-8 pb-8 text-right">{isOwnProfile ? 'السلاسل الخاصة بي' : 'السلاسل'}</StyledText>
          <FlatList
            data={series}
            renderItem={({ item }) => <SeriesCard series={item} />}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 10 }}
          />
        </View>
      )}

      <StyledText className="pl-1 text-2xl font-semibold mb-8 pb-8 text-right">{isOwnProfile ? 'البودكاستات الخاصة بي' : 'البودكاستات'}</StyledText>
      
      {podcasts.map((item) => (
        <View key={item.id} className="flex-row items-center">
          <View className="flex-1">
            <PodcastListItem podcast={item} />
          </View>
          {currentUser?.id === creator.id && (
            <TouchableOpacity
              onPress={() => handleDelete(item.id, item.image_url, item.audio_url)}
              className="p-2.5 ml-2.5"
            >
              <Ionicons name="trash-outline" size={24} color="red" />
            </TouchableOpacity>
          )}
        </View>
      ))}
      
      <View className="h-24" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreatorPage;