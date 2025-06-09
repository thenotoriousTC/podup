import "../../global.css";
import {
  DarkTheme,
  ThemeProvider,
  DefaultTheme,
} from "@react-navigation/native";
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import React, { useState, useEffect, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Slot } from "expo-router";
import PlayerProvider from "@/providers/playerprovider";
import { useFonts, Lobster_400Regular } from '@expo-google-fonts/lobster';
import { View, Text } from 'react-native';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Lobster_400Regular,
  });

  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    setSessionLoading(true); // Explicitly set loading to true at the start of the effect
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setSessionLoading(false);
    }).catch(() => setSessionLoading(false)); // Also set loading false on error

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      // If an auth state change happens, we are no longer in the "initial" session loading phase.
      setSessionLoading(false); 
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const queryClient = useMemo(() => new QueryClient(), []);

  const theme = useMemo(() => ({
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
  }), []);


  // You might want to show a loading indicator while the session is being fetched
  // For now, we'll proceed to render, and navigation logic will handle auth state

  return (
    <ThemeProvider value={theme}>
      <QueryClientProvider client={queryClient}>
        <PlayerProvider>
          <Slot />
        </PlayerProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
