import "../../global.css";
import { ThemeProvider, DefaultTheme } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Slot } from "expo-router";
import PlayerProvider from "@/providers/playerprovider";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { useEffect } from 'react';
import { ActivityIndicator, View } from "react-native";
import { useFonts, Pacifico_400Regular } from '@expo-google-fonts/pacifico';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

const queryClient = new QueryClient();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "black",
    background: "white",
    card: "#f8f8f8",
    text: "#000000",
    border: "#dddddd",
    notification: "#ff453a",
  },
};

function RootLayoutNav() {
  const { loading, session } = useAuth();
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
    const handleDeepLink = (event: { url: string }) => {
      const { url } = event;
      const params = Linking.parse(url).queryParams;

      // Extract tokens from the URL fragment
      const urlFragment = url.split('#')[1];
      if (urlFragment) {
        const fragmentParams = new URLSearchParams(urlFragment);
        const accessToken = fragmentParams.get('access_token');
        const refreshToken = fragmentParams.get('refresh_token');

        if (accessToken && refreshToken) {
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
      }
    };

    // Listen for incoming links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Clean up the subscription on unmount
    return () => {
      subscription.remove();
    };
  }, []);

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
  return (
    <ThemeProvider value={theme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
