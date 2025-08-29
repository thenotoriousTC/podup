import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PodcastListItem from '@/components/bookListItem';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyledText } from '@/components/StyledText';

const DOWNLOADED_PODCASTS_KEY = 'downloaded-podcasts';

interface Podcast {
    id: string;
    title: string;
    author: string;
    audio_url: string;
    thumbnail_url?: string;
    image_url?: string;
    description?: string;
    local_audio_url?: string;
}

export default function DownloadsScreen() {
    const [downloadedPodcasts, setDownloadedPodcasts] = useState<Podcast[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const isFocused = useIsFocused();
    const router = useRouter();

    const fetchDownloadedPodcasts = async () => {
        setIsLoading(true);
        try {
            const downloadedPodcastsRaw = await AsyncStorage.getItem(DOWNLOADED_PODCASTS_KEY);
            if (downloadedPodcastsRaw) {
                const podcastsObject = JSON.parse(downloadedPodcastsRaw);
                const podcastsArray = Object.values(podcastsObject);
                setDownloadedPodcasts(podcastsArray as Podcast[]);
            }
        } catch (e) {
            console.error('Failed to load downloaded podcasts.', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isFocused) {
            fetchDownloadedPodcasts();
        }
    }, [isFocused]);

    const handleGoBack = () => {
        router.back();
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#4F46E5" />
                    </TouchableOpacity>
                    <StyledText style={styles.title}>التحميلات</StyledText>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            </View>
        );
    }

    if (downloadedPodcasts.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#4F46E5" />
                    </TouchableOpacity>
                    <StyledText style={styles.title}>التحميلات</StyledText>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.centered}>
                    <StyledText style={styles.emptyText}>لا توجد تحميلات.</StyledText>
                    <StyledText style={styles.emptySubText}>
                        اضغط على زر التحميل على البودكاست لحفظه للسماع دون اتصال.
                    </StyledText>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#4F46E5" />
                </TouchableOpacity>
                <StyledText style={styles.title}>التحميلات</StyledText>
                <View style={styles.placeholder} />
            </View>
            <FlatList
                data={downloadedPodcasts}
                renderItem={({ item }) => <PodcastListItem podcast={item} />}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ gap: 16, padding: 10 }}
                onRefresh={fetchDownloadedPodcasts}
                refreshing={isLoading}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 50, // Account for status bar
        backgroundColor: '#fff',
       
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: 'semibold',
        color: '#4F46E5',
    },
    placeholder: {
        width: 40, // Same width as back button to center the title
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'semibold',
        color: '#555',
    },
    emptySubText: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginTop: 10,
    },
});