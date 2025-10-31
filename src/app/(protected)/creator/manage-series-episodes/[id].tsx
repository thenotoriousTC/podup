import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import { TouchableOpacity } from '@/components/TouchableOpacity';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { usePodcasts } from '@/hooks/usePodcasts';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { Ionicons } from '@expo/vector-icons';
import { StyledText } from '@/components/StyledText';
import DiscoveryPodcastListItem from '@/components/discoveryBookListItem';

type Podcast = Database['public']['Tables']['podcasts']['Row'];

export default function AddEpisodesScreen() {
  const { id: rawSeriesId } = useLocalSearchParams();
  const seriesId = Array.isArray(rawSeriesId) ? rawSeriesId[0] : (rawSeriesId as string | undefined);
  const { user } = useAuth();
  const { getStandalonePodcastsByCreator, refreshPodcasts } = usePodcasts('');
  const router = useRouter();

  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [selectedPodcasts, setSelectedPodcasts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPodcasts = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      const data = await getStandalonePodcastsByCreator(user.id);
      setPodcasts(data);
      setIsLoading(false);
    };
    fetchPodcasts();
  }, [user?.id]);

  const toggleSelection = (podcastId: string) => {
    setSelectedPodcasts((prev) =>
      prev.includes(podcastId)
        ? prev.filter((id) => id !== podcastId)
        : [...prev, podcastId]
    );
  };

  const handleAddEpisodes = async () => {
    if (selectedPodcasts.length === 0) {
      Alert.alert('لم تختر اي محتوى', 'يرجى اختيار محتوى لإضافته');
      return;
    }
    if (!seriesId) {
      Alert.alert('خطأ', 'لا يمكن تحديد السلسلة.');
      return;
    }
    if (!user?.id) {
      Alert.alert('خطأ', 'يجب تسجيل الدخول للمتابعة.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('podcasts')
        .update({ series_id: seriesId })
        .in('id', selectedPodcasts)
        .eq('user_id', user!.id);

      if (error) throw error;

      Alert.alert('تم', 'تم إضافة المحتوى بنجاح');
      await refreshPodcasts(); // Invalidate cache to reflect changes
      router.dismissAll();
    } catch (error: any) {
      console.error('Error adding episodes:', error);
      Alert.alert('خطأ', `فشل إضافة المحتوى: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <ActivityIndicator style={styles.centered} size="large" color="#FD842B" />;
  }

  const renderItem = ({ item }: { item: Podcast }) => {
    try {
      const isSelected = selectedPodcasts.includes(item.id);
      return (
        <TouchableOpacity onPress={() => toggleSelection(item.id)} style={[styles.itemContainer, isSelected && styles.itemContainerSelected]}>
          <View style={{ flex: 1 }}>
            <DiscoveryPodcastListItem 
              podcast={item} 
              isInLibrary={false}
              onToggleLibrary={() => {}}
              isTogglingLibrary={false}
            />
          </View>
          <View style={styles.checkboxContainer}>
            <Ionicons 
              name={isSelected ? 'checkbox' : 'square-outline'} 
              size={24} 
              color={isSelected ? '#007AFF' : '#ccc'} 
            />
          </View>
        </TouchableOpacity>
      );
    } catch (error) {
      console.error(`Error rendering podcast item ${item.id}:`, error);
      return (
        <View style={[styles.itemContainer, styles.errorItem]}>
          <StyledText style={styles.errorText}>حدث خطأ أثناء عرض هذا العنصر.</StyledText>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'إضافة حلقات' }} />
      <View>
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center p-2 w-20"
        >
          <Ionicons name="arrow-back" size={28} color="black" />
        </TouchableOpacity>
      </View>
      {podcasts.length > 0 ? (
        <>
        <StyledText className='text-xl font-semibold text-right'>اختر حلقات</StyledText>
        <FlatList
          data={podcasts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
        </>
      ) : (
        <View style={styles.centered}>
          <StyledText style={styles.emptyText}>لا توجد لديك حلقات مستقلة لإضافتها.</StyledText>
        </View>
      )}
      <TouchableOpacity 
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleAddEpisodes} 
        disabled={isSubmitting || selectedPodcasts.length === 0}
      >
        <StyledText style={styles.buttonText}>
          {isSubmitting ? 'جاري الإضافة...' : `إضافة (${selectedPodcasts.length}) حلقات`}
        </StyledText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop:50,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop:50,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemContainerSelected: {
    borderColor: '#007AFF',
  },

  checkboxContainer: {
    paddingHorizontal: 16,
  },
  podcastTitle: {
    flex: 1,
    fontSize: 16,
    textAlign: 'right',
  },
  errorItem: {
    backgroundColor: '#FFF0F0',
    borderColor: '#D9534F',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#D9534F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  button: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#A9A9A9',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
