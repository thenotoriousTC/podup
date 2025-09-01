import "../../global.css";
import { ThemeProvider, DefaultTheme } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

const queryClient = new QueryClient();

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
      console.log('🔗 Deep link received:', url);
      
      const params = Linking.parse(url).queryParams;
      console.log('📋 Query params:', params);

      // Extract tokens from the URL fragment
      const urlFragment = url.split('#')[1];
      console.log('🔍 URL fragment:', urlFragment);
      
      if (urlFragment) {
        const fragmentParams = new URLSearchParams(urlFragment);
        const accessToken = fragmentParams.get('access_token');
        const refreshToken = fragmentParams.get('refresh_token');
        const type = fragmentParams.get('type');
        
        console.log('🔑 Access token exists:', !!accessToken);
        console.log('🔄 Refresh token exists:', !!refreshToken);
        console.log('📝 Type:', type);

        if (accessToken && refreshToken) {
          console.log('✅ Setting session with tokens');
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          // If this is a password recovery, redirect to update-password page
          if (type === 'recovery') {
            console.log('🔐 Password recovery detected, redirecting to update-password');
            // Set a flag to indicate password recovery mode
            try {
              await AsyncStorage.setItem('isPasswordRecovery', 'true');
              // Ensure the auth state is updated before navigating
              router.replace('/(auth)/update-password');
            } catch (error) {
              console.error('Failed to set password recovery flag:', error);
              router.replace('/(auth)/update-password');
            }
          } else {
            console.log('ℹ️ Not a recovery type, type is:', type);
          }
        } else {
          console.log('❌ Missing tokens in URL fragment');
        }
      } else {
        console.log('❌ No URL fragment found');
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
        console.log('🛣️ Current path segments:', segments);
        console.log('🛣️ Current path string:', currentPath);
        console.log('🔐 Is password recovery:', isPasswordRecovery);
        
        if (currentPath.includes('update-password') || isPasswordRecovery) {
          console.log('🚫 In password recovery mode, skipping redirect');
          return; // Don't redirect if user is updating password or in recovery mode
        }

        console.log('👤 Session exists, checking profile for redirect');
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('❌ Error fetching profile for redirect:', error);
          return;
        }

        if (!profile || !profile.full_name) {
          console.log('📝 No profile found, redirecting to onboarding');
          router.replace('/(protected)/onboarding');
        } else {
          console.log('✅ Profile exists, no redirect needed');
        }
      }
    };

    if (!loading && session) {
      console.log('🔄 Session loaded, checking for redirect. Loading:', loading, 'Session exists:', !!session, 'Recovery mode:', isPasswordRecovery);
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

export default function RootLayout() {
  // Initialize Track Player service
  useEffect(() => {
    const initializeTrackPlayer = async () => {
      try {
        // Register the playback service
        TrackPlayer.registerPlaybackService(() => PlaybackService);
        
        await setupTrackPlayer();
        console.log('Track Player initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Track Player:', error);
      }
    };

    initializeTrackPlayer();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={theme}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
