import { supabase } from '@/lib/supabase';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { Alert, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from 'react-native';
import { StyledText } from '@/components/StyledText';
import { makeRedirectUri } from 'expo-auth-session';

const { height: screenHeight } = Dimensions.get('window');

const redirectTo = makeRedirectUri({
  path: '/update-password',
});

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
   const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const onSendResetLink = async () => {
    if (loading) return;
    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      Alert.alert('تنبيه', 'يرجى إدخال بريد إلكتروني صالح.');
      return;
    }
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo,
      });

      // Avoid user enumeration: always show a generic success message.
      if (error?.status === 429) {
        Alert.alert('يرجى المحاولة لاحقًا', 'لقد قمت بعدة محاولات. انتظر قليلاً ثم حاول مجددًا.');
      }
      Alert.alert('تحقق من بريدك الإلكتروني', 'إذا كان البريد مسجلاً، فستصلك رسالة برابط لإعادة تعيين كلمة المرور.');
    } catch (err: any) {
      // Network or unexpected error: still avoid leaking details.
      console.error('resetPasswordForEmail failed', err);
      Alert.alert('حدث خطأ', 'تعذر إرسال الرابط حاليًا. يرجى المحاولة لاحقًا.');
    } finally {
      setLoading(false);
    }
  };

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
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <StyledText fontWeight="Bold" className='text-3xl font-semibold text-center mb-8'>
              إعادة تعيين كلمة المرور
            </StyledText>
            <StyledText className='text-center mb-8'>
              أدخل بريدك الإلكتروني لتلقي رابط إعادة تعيين كلمة المرور.
            </StyledText>

            <View className='gap-4'>
              <View>
                <StyledText className='text-sm font-semibold mb-1 text-right'>
                  البريد الإلكتروني
                </StyledText>
                <TextInput
                  className='w-full p-4 bg-gray-100 rounded-full text-black text-right'
                  autoCapitalize='none'
                  value={email}
                  placeholder='البريد الإلكتروني'
                  placeholderTextColor='#9CA3AF'
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoComplete="email"
                  returnKeyType="done"
                  autoCorrect={false}
                  textContentType='emailAddress'
                  enablesReturnKeyAutomatically
                  onSubmitEditing={()=>isValidEmail&&onSendResetLink()}
                />
              </View>

              <TouchableOpacity
                className={`w-full p-4 rounded-full mt-6 ${loading || !isValidEmail ? 'bg-gray-400 opacity-60' : 'bg-indigo-600'}`}
                onPress={onSendResetLink}
                disabled={loading || !isValidEmail}
                accessibilityRole='button'
                accessibilityState={{
                  disabled: loading || !isValidEmail , busy: loading
                }}
                accessibilityLabel='إرسال رابط إعادة التعيين'
              >
                <StyledText className='text-white text-center font-semibold'>
                  {loading ? 'جار الإرسال...' : 'إرسال رابط إعادة التعيين'}
                </StyledText>
              </TouchableOpacity>
            </View>

            <View className='flex-row justify-center items-center mt-6 gap-2'>
              <Link href='/sign-in'>
                <StyledText className='text-indigo-600 font-semibold ml-1'>العودة لتسجيل الدخول</StyledText>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
