import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PodcastListItem from '@/components/bookListItem';
import { useIsFocused } from '@react-navigation/native';

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

    if (isLoading) {
        return <ActivityIndicator style={styles.centered} size="large" />;
    }

    if (downloadedPodcasts.length === 0) {
        return (
            <View style={styles.centered}>
                <Text style={styles.emptyText}>No downloads yet.</Text>
                <Text style={styles.emptySubText}>Tap the download icon on a podcast to save it for offline listening.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
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
        backgroundColor: '#f0f0f0',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#555',
    },
    emptySubText: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginTop: 10,
    },
});
