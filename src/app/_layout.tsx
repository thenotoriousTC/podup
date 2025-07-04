import "../../global.css";
import { ThemeProvider, DefaultTheme } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Slot } from "expo-router";
import PlayerProvider from "@/providers/playerprovider";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { ActivityIndicator, View } from "react-native";
import { useFonts, Pacifico_400Regular } from '@expo-google-fonts/pacifico';

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
  const { loading } = useAuth();
  const [fontsLoaded] = useFonts({
    'Pacifico-Regular': Pacifico_400Regular,
  });

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
