import { Redirect, Stack } from 'expo-router'
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import React, { useState, useEffect } from 'react';

export default function AuthRoutesLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return null;
  }

  if (session) {
    return <Redirect href={'/(protected)'} />;
  }

  return <Stack />
}