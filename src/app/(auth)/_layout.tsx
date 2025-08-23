import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';

export default function AuthLayout() {
  const { session, loading, isPasswordRecovery } = useAuth();
  


  if (loading) {
    return null; // Or a loading indicator
  }

  if (session && !isPasswordRecovery) {
    return <Redirect href="/(protected)" />;
  }

  return (
      <Stack 
        screenOptions={{
          headerShown: false,
        }}
      />
    
  );
}
