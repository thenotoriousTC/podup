import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isPasswordRecovery: boolean;
  clearPasswordRecovery: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  isPasswordRecovery: false,
  clearPasswordRecovery: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error.message);
      }
      
      // Check if we're in password recovery mode
      try {
        const recoveryFlag = await AsyncStorage.getItem('isPasswordRecovery');
        if (recoveryFlag === 'true') {
          console.log(' Found password recovery flag in storage');
          setIsPasswordRecovery(true);
        }
      } catch (error) {
        console.error('Error reading recovery flag from storage:', error);
      }
      
      setSession(data.session);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state change:', event, 'Session exists:', !!session, 'User ID:', session?.user?.id);
      
      // Check if this is a password recovery session
      const recoveryFlag = await AsyncStorage.getItem('isPasswordRecovery');
      if (event === 'PASSWORD_RECOVERY' || recoveryFlag === 'true') {
        console.log('🔐 Password recovery session detected');
        setIsPasswordRecovery(true);
        if (event === 'PASSWORD_RECOVERY') {
          try {
            await AsyncStorage.setItem('isPasswordRecovery', 'true');
          } catch (error) {
            console.error('Error saving recovery flag:', error);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('🔐 Signed out, clearing recovery flag');
        setIsPasswordRecovery(false);
        AsyncStorage.removeItem('isPasswordRecovery');
      }
      
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const clearPasswordRecovery = async () => {
    console.log('🔐 Clearing password recovery flag');
    await AsyncStorage.removeItem('isPasswordRecovery');
    setIsPasswordRecovery(false);
  };

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    isPasswordRecovery,
    clearPasswordRecovery,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
