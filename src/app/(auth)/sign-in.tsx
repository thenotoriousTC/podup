import { supabase } from '@/lib/supabase';
import { Link, useRouter } from 'expo-router';
import { Alert, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from 'react-native';
import React from 'react';
import { StyledText } from '@/components/StyledText';

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
          Alert.alert('خطأ في تسجيل الدخول', error.message);
        }
        console.error('Supabase Sign In Error:', error.message);
      } else if (data.session) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        if (!profile || !profile.full_name) {
          router.replace('/(protected)/onboarding');
        } else {
          router.replace('/(protected)');
        }
      } else {
        Alert.alert('خطأ في تسجيل الدخول', 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
      }
    } catch (err: any) {
      console.error('Unexpected Sign In Exception:', JSON.stringify(err, null, 2));
      Alert.alert('خطأ في تسجيل الدخول', err.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
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
        Alert.alert('خطأ', error.message);
      } else {
        Alert.alert('نجاح', 'تم إرسال رسالة التحقق. يرجى التحقق من بريدك الإلكتروني لتأكيد حسابك قبل تسجيل الدخول');
      }
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'فشل في إعادة إرسال رسالة التحقق');
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
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <StyledText fontWeight="Bold" style={{fontSize: 75, color: '#2563EB', paddingBottom:45,fontFamily:'Pacifico-Regular',paddingTop:5}}>  PodHub</StyledText>
            <StyledText fontWeight="Bold" className='text-3xl font-bold text-center mb-8'>
              مرحبًا بك
            </StyledText>
            <StyledText className='text-center mb-8'>
              قم بتسجيل الدخول أو إنشاء حساب جديد
            </StyledText>

            {emailVerificationMessage ? (
              <View className="mb-4 p-3 bg-yellow-100 rounded-lg">
                <StyledText className="text-yellow-800">{emailVerificationMessage}</StyledText>
                <TouchableOpacity onPress={onResendVerification}>
                  <StyledText className="text-blue-600 mt-2 font-semibold">إعادة إرسال رسالة التحقق</StyledText>
                </TouchableOpacity>
              </View>
            ) : null}

            <View className='gap-4'>
              <View>
                <StyledText className='text-sm font-medium mb-1 text-right'>
                  البريد الإلكتروني
                </StyledText>
                <TextInput
                  className='w-full p-4 bg-gray-100 rounded-full text-black text-right'
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
                <StyledText className='text-sm font-medium mb-1 text-right'>
                  كلمة المرور
                </StyledText>
                <TextInput
                  className='w-full p-4 rounded-full text-black bg-gray-100 text-right'
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
                className={`w-full p-4 rounded-full mt-6 ${loading ? 'bg-gray-400' : 'bg-blue-600'}`}
                onPress={onSignInPress}
                disabled={loading}
              >
                <StyledText className='text-white text-center font-semibold'>
                  {loading ? '    تسجيل الدخول...' : 'تسجيل الدخول'}
                </StyledText>
              </TouchableOpacity>
            </View>
<View className='flex-row justify-center items-center mt-6 gap-2'>
             
            <Link href='/sign-up'>
                <StyledText className='text-blue-400 font-semibold ml-1'>إنشاء حساب</StyledText>
              </Link> 
                <StyledText className='text-gray-400'>ليس لديك حساب؟</StyledText>
            </View>
            
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}