import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Alert, TextInput, View, KeyboardAvoidingView, ScrollView, Dimensions } from 'react-native';
import { TouchableOpacity } from '@/components/TouchableOpacity';
import { StyledText } from '@/components/StyledText';
import { Session } from '@supabase/supabase-js';
import { useAuth } from '@/providers/AuthProvider';

const { height: screenHeight } = Dimensions.get('window');

export default function UpdatePasswordPage() {
  const router = useRouter();
  const { clearPasswordRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    console.log('🔄 UpdatePassword: Component mounted, checking session');
    
    const checkSession = async () => {
      try {
        console.log('⏳ UpdatePassword: Waiting 500ms for deep link processing');
        // Wait a bit for deep link to process
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔍 UpdatePassword: Session check result:', !!session, session?.user?.id);
        
        if (mounted) {
          setSession(session);
          setSessionLoading(false);
          console.log('✅ UpdatePassword: Session state updated');
        }
      } catch (error) {
        console.error('❌ UpdatePassword: Error checking session:', error);
        if (mounted) {
          setSessionLoading(false);
        }
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 UpdatePassword: Auth state change:', event, 'Session exists:', !!session, 'User ID:', session?.user?.id);
      if (mounted) {
        setSession(session);
        setSessionLoading(false);
      }
    });

    return () => {
      console.log('🧹 UpdatePassword: Component unmounting');
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const onUpdatePassword = async () => {
    // Validate password strength
    if (password.length < 8) {
      Alert.alert('خطأ', 'يجب أن تكون كلمة المرور 8 أحرف على الأقل.');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('خطأ', 'كلمتا المرور غير متطابقتين.');
      return;
    }
    if (loading) return;
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        Alert.alert('خطأ', error.message);
      } else {
        // Clear the password recovery flag using the context function
        await clearPasswordRecovery();
        console.log('🔐 Password updated successfully, clearing recovery flag');
        
        Alert.alert('نجاح', 'تم تحديث كلمة المرور بنجاح.', [
          { text: 'OK', onPress: () => router.replace('/sign-in') },
        ]);
      }
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'فشل تحديث كلمة المرور.');
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading) {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <StyledText>جار التحميل...</StyledText>
        </View>
    );
  }

  if (!session) {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <StyledText className='text-center mb-4'>لم يتم العثور على جلسة استرداد كلمة المرور</StyledText>
            <TouchableOpacity onPress={() => router.replace('/forgot-password')}>
              <StyledText className='text-[#FD842B] font-semibold'>طلب رابط جديد</StyledText>
            </TouchableOpacity>
        </View>
    );
  }

  return (
    <View className='flex-1'>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior='padding'
        keyboardVerticalOffset={0}
      >
        <ScrollView
          className='flex-1'
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            minHeight: screenHeight - 100
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <StyledText fontWeight="Bold" className='text-3xl font-semibold text-center mb-8'>
              تحديث كلمة المرور
            </StyledText>
            <StyledText className='text-center mb-8'>
              أدخل كلمة المرور الجديدة.
            </StyledText>

            <View className='gap-4'>
              <View>
                <StyledText className='text-sm font-semibold mb-1 text-right'>
                  كلمة المرور الجديدة
                </StyledText>
                <TextInput
                  className='w-full p-4 bg-gray-100 rounded-full text-black text-right'
                  value={password}
                  placeholder='كلمة المرور الجديدة'
                  placeholderTextColor='#9CA3AF'
                  secureTextEntry={true}
                  onChangeText={setPassword}
                  returnKeyType="next"
                />
              </View>
              <View>
                <StyledText className='text-sm font-semibold mb-1 text-right'>
                  تأكيد كلمة المرور
                </StyledText>
                <TextInput
                  className='w-full p-4 bg-gray-100 rounded-full text-black text-right'
                  value={confirmPassword}
                  placeholder='تأكيد كلمة المرور'
                  placeholderTextColor='#9CA3AF'
                  secureTextEntry={true}
                  onChangeText={setConfirmPassword}
                  returnKeyType="done"
                  onSubmitEditing={onUpdatePassword}
                />
              </View>

              <TouchableOpacity
                className={`w-full p-4 rounded-full mt-6 ${loading ? 'bg-gray-400' : 'bg-[#FD842B]'}`}
                onPress={onUpdatePassword}
                disabled={loading}
              >
                <StyledText className='text-white text-center font-semibold'>
                  {loading ? 'جار التحديث...' : 'تحديث كلمة المرور'}
                </StyledText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
