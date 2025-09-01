import { AppState, type AppStateStatus } from 'react-native';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase URL or Anon Key is missing. Make sure to set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
  );
  throw new Error('Missing required Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // Use AsyncStorage for session persistence in React Native
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Important for React Native, as there's no URL to detect session from
  },
});

const handleAppStateChange = (state: AppStateStatus) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
};

// Start immediately on cold start if already active.
if (AppState.currentState === 'active') {
  supabase.auth.startAutoRefresh();
}

// Ensure a single listener under Fast Refresh in dev.
// @ts-ignore dev-only global marker
(global as any).__supabaseAppStateSubscription__?.remove?.();
// @ts-ignore store subscription globally for next refresh
(global as any).__supabaseAppStateSubscription__ = AppState.addEventListener('change', handleAppStateChange);
