import { View, StyleSheet, ActivityIndicator } from "react-native";
import { Redirect, Slot, Stack } from "expo-router";
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import React, { useState, useEffect } from 'react';
import { FadeInDown } from "react-native-reanimated";

export default function ProtectedLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch session on initial load
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      // If loading was true and we get a session or no session, we are no longer loading initial state.
      if (loading) {
        setLoading(false);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []); // Changed dependency array to []

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!session) {
    // User is not signed in, redirect to the sign-in screen.
    return <Redirect href={'/(auth)/sign-in'} />;
  }

  // User is signed in, render the protected content.
  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerStyle: styles.header,
          headerTitleStyle: styles.headerTitle,
          headerShadowVisible: false, // This should be a valid prop
          // Removed contentStyle from here to simplify
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