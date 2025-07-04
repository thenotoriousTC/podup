import { supabase } from '@/lib/supabase';
import { Link, useRouter } from 'expo-router';
import { Alert, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from 'react-native';
import React from 'react';

const { height: screenHeight } = Dimensions.get('window');

export default function Page() {
  const router = useRouter();
  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [emailVerificationMessage, setEmailVerificationMessage] = React.useState('');

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (loading) return;
    setLoading(true);
    setEmailVerificationMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailAddress,
        password: password,
      });

      if (error) {
        // Check specifically for email not confirmed error
        if (error.message.toLowerCase().includes('email not confirmed')) {
          setEmailVerificationMessage('يرجى التحقق من بريدك الإلكتروني لتأكيد حسابك قبل تسجيل الدخول');
        } else {
          Alert.alert('Sign In Error', error.message);
        }
        console.error('Supabase Sign In Error:', error.message);
      } else if (data.session) {
        router.replace('/(protected)');
      } else {
        Alert.alert('Sign In Error', 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
      }
    } catch (err: any) {
      console.error('Unexpected Sign In Exception:', JSON.stringify(err, null, 2));
      Alert.alert('Sign In Error', err.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // Handle resend verification email
  const onResendVerification = async () => {
    if (!emailAddress || loading) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailAddress,
      });
      
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'تم إرسال رسالة التحقق. يرجى التحقق من بريدك الإلكتروني لتأكيد حسابك قبل تسجيل الدخول');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'فشل في إعادة إرسال رسالة التحقق');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className='flex-1'>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior='padding'
        keyboardVerticalOffset={ 0}
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
          <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 40 }}>
            <Text className='text-3xl font-bold text-center mb-8'>
              مرحبًا بك
            </Text>
            <Text className='text-center mb-8'>
              قم بتسجيل الدخول أو إنشاء حساب جديد
            </Text>

            {emailVerificationMessage ? (
              <View className="mb-4 p-3 bg-yellow-100 rounded-lg">
                <Text className="text-yellow-800">{emailVerificationMessage}</Text>
                <TouchableOpacity onPress={onResendVerification}>
                  <Text className="text-blue-600 mt-2 font-semibold">إعادة إرسال رسالة التحقق</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View className='gap-4'>
              <View>
                <Text className='text-sm font-medium mb-1 text-right'>
                  البريد الإلكتروني
                </Text>
                <TextInput
                  className='w-full p-4 border border-gray-100 rounded-lg text-black'
                  autoCapitalize='none'
                  value={emailAddress}
                  placeholder='البريد الإلكتروني'
                  placeholderTextColor='#9CA3AF'
                  onChangeText={setEmailAddress}
                  keyboardType="email-address"
                  autoComplete="email"
                  returnKeyType="next"
                />
              </View>

              <View>
                <Text className='text-sm font-medium mb-1 text-right'>
                  كلمة المرور
                </Text>
                <TextInput
                  className='w-full p-4 border border-gray-100 rounded-lg text-black'
                  value={password}
                  placeholder='كلمة المرور'
                  placeholderTextColor='#9CA3AF'
                  secureTextEntry={true}
                  onChangeText={setPassword}
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={onSignInPress}
                />
              </View>

              <TouchableOpacity
                className={`w-full p-4 rounded-lg mt-6 ${loading ? 'bg-gray-400' : 'bg-blue-600'}`}
                onPress={onSignInPress}
                disabled={loading}
              >
                <Text className='text-white text-center font-semibold'>
                  {loading ? '    تسجيل الدخول...' : 'تسجيل الدخول'}
                </Text>
              </TouchableOpacity>
            </View>
<View className='flex-row justify-center items-center mt-6 gap-2'>
            <Link href='/sign-up'>
                <Text className='text-blue-400 font-semibold ml-1'>إنشاء حساب</Text>
              </Link> 
               <Text className='text-gray-400'>ليس لديك حساب؟</Text>
              
            </View>
            
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}