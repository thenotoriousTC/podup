import { View, StyleSheet, ActivityIndicator } from "react-native";
import { Redirect, Slot, Stack } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { FadeInDown } from "react-native-reanimated";

export default function ProtectedLayout() {
   const { isSignedIn, isLoaded } = useAuth();
   
    if (!isLoaded) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        );
    }
    
    if (!isSignedIn) {
        return <Redirect href={'/sign-in'} />;
    }
    
    return (
        <View style={styles.container}>
          <Stack
            screenOptions={{
              headerStyle: styles.header,
              headerTitleStyle: styles.headerTitle,
              headerShadowVisible: false,
              contentStyle: { backgroundColor: '#FFFFFF' },
            }}
          >
            <Stack.Screen
              name="(tabs)"
              options={{ headerShown: false }}
            />
            
            <Stack.Screen
              name="player"
              options={{
                headerShown: false,
                animation: 'fade_from_bottom',
                presentation: 'modal',
              }}
            />
          </Stack>
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    elevation: 0, // Android
  },
  headerTitle: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '600',
  },
});