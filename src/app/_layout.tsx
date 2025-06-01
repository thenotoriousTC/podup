import "../../global.css";
import {
  DarkTheme,
  ThemeProvider,
  DefaultTheme,
} from "@react-navigation/native";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Slot } from "expo-router";
import PlayerProvider from "@/providers/playerprovider";
import { useFonts, Lobster_400Regular } from '@expo-google-fonts/lobster';
import { View, Text } from 'react-native';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Lobster_400Regular,
  });

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

  // Wait for fonts to load before rendering the app
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading fonts...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider value={theme}>
      <QueryClientProvider client={queryClient}>
        <ClerkProvider tokenCache={tokenCache}>
          <PlayerProvider>
            <Slot />
          </PlayerProvider>
        </ClerkProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
