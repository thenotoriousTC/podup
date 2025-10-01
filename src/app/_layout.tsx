// AWS SDK v3 Polyfills for React Native - MUST be imported first
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import "../../global.css";
import { ThemeProvider, DefaultTheme } from "@react-navigation/native";
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { Slot, useRouter, useSegments } from "expo-router";
import PlayerProvider from "@/providers/playerprovider";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { useEffect } from 'react';
import { ActivityIndicator, View, I18nManager } from "react-native";
import { useFonts, Pacifico_400Regular } from '@expo-google-fonts/pacifico';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import TrackPlayer from 'react-native-track-player';
import { setupTrackPlayer } from '@/services/trackPlayerService';
import { PlaybackService } from '@/services/index';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Configure RTL settings at app entry point
if (I18nManager.isRTL) {
  I18nManager.allowRTL(false);
  I18nManager.forceRTL(false);
}

// Configure QueryClient with offline-first behavior
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst', // Always try to run queries, even offline
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
      staleTime: 1000*60*5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: (failureCount, error) => {
        // Don't retry network errors when offline
        if (error?.message?.includes('fetch')) return false;
        return failureCount < 3;
      },
    },
  },
});

// TanStack Query will handle network detection automatically
// For more advanced network detection, consider installing @react-native-community/netinfo

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "white",
    background: "white",
    card: "#f8f8f8",
    text: "#000000",
    border: "#dddddd",
    notification: "#ff453a",
  },
};

function RootLayoutNav() {
  const { loading, session, isPasswordRecovery } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [fontsLoaded] = useFonts({
    'Pacifico-Regular': Pacifico_400Regular,
    'Cairo-Black': require('../../assets/fonts/Cairo-Black.ttf'),
    'Cairo-Bold': require('../../assets/fonts/Cairo-Bold.ttf'),
    'Cairo-ExtraBold': require('../../assets/fonts/Cairo-ExtraBold.ttf'),
    'Cairo-ExtraLight': require('../../assets/fonts/Cairo-ExtraLight.ttf'),
    'Cairo-Light': require('../../assets/fonts/Cairo-Light.ttf'),
    'Cairo-Medium': require('../../assets/fonts/Cairo-Medium.ttf'),
    'Cairo-Regular': require('../../assets/fonts/Cairo-Regular.ttf'),
    'Cairo-SemiBold': require('../../assets/fonts/Cairo-SemiBold.ttf'),
  });

  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const { url } = event;
      __DEV__ && console.log('🔗 Deep link received:', url);
      
      const params = Linking.parse(url).queryParams;
      __DEV__ && console.log('📋 Query params:', params);

      // Extract tokens from the URL fragment
      const urlFragment = url.split('#')[1];
      __DEV__ && console.log('🔍 URL fragment:', urlFragment);
      
      if (urlFragment) {
        const fragmentParams = new URLSearchParams(urlFragment);
        const accessToken = fragmentParams.get('access_token');
        const refreshToken = fragmentParams.get('refresh_token');
        const type = fragmentParams.get('type');
        
        __DEV__ && console.log('🔑 Access token exists:', !!accessToken);
        __DEV__ && console.log('🔄 Refresh token exists:', !!refreshToken);
        __DEV__ && console.log('📝 Type:', type);

        if (accessToken && refreshToken) {
          __DEV__ && console.log('✅ Setting session with tokens');
          try {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) {
              __DEV__ && console.error('Failed to set session:', error);
              return;
            }
          } catch (error) {
            __DEV__ && console.error('Failed to set session:', error);
            return;
          }

          // If this is a password recovery, redirect to update-password page
          if (type === 'recovery') {
            __DEV__ && console.log('🔐 Password recovery detected, redirecting to update-password');
            // Set a flag to indicate password recovery mode
            try {
              await AsyncStorage.setItem('isPasswordRecovery', 'true');
              // Ensure the auth state is updated before navigating
              router.replace('/(auth)/update-password');
            } catch (error) {
              __DEV__ && console.error('Failed to set password recovery flag:', error);
              router.replace('/(auth)/update-password');
            }
          } else {
            __DEV__ && console.log('ℹ️ Not a recovery type, type is:', type);
          }
        } else {
          __DEV__ && console.log('❌ Missing tokens in URL fragment');
        }
      } else {
        __DEV__ && console.log('❌ No URL fragment found');
      }
    };

    // Listen for incoming links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Clean up the subscription on unmount
    return () => {
      subscription.remove();
    };
  }, [router]);

  useEffect(() => {
    const checkProfileAndRedirect = async () => {
      if (session?.user) {
        // Check if we're currently on the update-password page or in password recovery mode
        const currentPath = segments.join('/');
        __DEV__ && console.log('🛣️ Current path segments:', segments);
        __DEV__ && console.log('🛣️ Current path string:', currentPath);
        __DEV__ && console.log('🔐 Is password recovery:', isPasswordRecovery);
        
        if (currentPath.includes('update-password') || isPasswordRecovery) {
          __DEV__ && console.log('🚫 In password recovery mode, skipping redirect');
          return; // Don't redirect if user is updating password or in recovery mode
        }

        __DEV__ && console.log('👤 Session exists, checking profile for redirect');
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          __DEV__ && console.error('❌ Error fetching profile for redirect:', error);
          return;
        }

        if (!profile || !profile.full_name) {
          __DEV__ && console.log('📝 No profile found, redirecting to onboarding');
          router.replace('/(protected)/onboarding');
        } else {
          __DEV__ && console.log('✅ Profile exists, no redirect needed');
        }
      }
    };

    if (!loading && session) {
      __DEV__ && console.log('🔄 Session loaded, checking for redirect. Loading:', loading, 'Session exists:', !!session, 'Recovery mode:', isPasswordRecovery);
      checkProfileAndRedirect();
    }
  }, [session, loading, router, segments, isPasswordRecovery]);

  if (loading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <PlayerProvider>
      <Slot />
    </PlayerProvider>
  );
}

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

export default function RootLayout() {
  // Initialize Track Player service
  useEffect(() => {
    const initializeTrackPlayer = async () => {
      try {
        // Register the playback service
        TrackPlayer.registerPlaybackService(() => PlaybackService);
        
        await setupTrackPlayer();
        __DEV__ && console.log('Track Player initialized successfully');
      } catch (error) {
        __DEV__ && console.error('Failed to initialize Track Player:', error);
      }
    };

    initializeTrackPlayer();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={theme}>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: asyncStoragePersister }}
        >
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </PersistQueryClientProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
