import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';

export default function AuthLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return null; // Or a loading indicator
  }

  if (session) {
    return <Redirect href="/(protected)" />;
  }

  return <Stack />;
}