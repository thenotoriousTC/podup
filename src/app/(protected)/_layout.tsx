import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";

export default function ProtectedLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>جاري التحميل...</Text>
        <Text className="text-red-600 text-xl mt-2">يرجى التحقق من اتصالك بالإنترنت</Text>
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerStyle: styles.header,
          headerShown:false,
          headerTitleStyle: styles.headerTitle,
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="player"
          options={{
            headerShown: false,
            animation: "fade_from_bottom",
            presentation: "modal",
          }}
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  header: {
    backgroundColor: "#FFFFFF",
    elevation: 0,
  },
  headerTitle: {
    color: "#007AFF",
    fontSize: 17,
    fontWeight: "600",
  },
});