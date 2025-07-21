import * as React from 'react';
import {Alert, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Link, useRouter } from 'expo-router';
import { StyledText } from '@/components/StyledText';

const { height: screenHeight } = Dimensions.get('window');

export default function SignUpScreen() {
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: emailAddress,
        password: password,
      });

      if (error) {
        Alert.alert('خطأ في إنشاء الحساب', error.message);
        console.error('Supabase Sign Up Error:', error.message);
      } else if (data.user) {
        // User created, Supabase sends verification email
        Alert.alert(
          'تم إرسال رسالة التحقق',
          'الرجاء التحقق من بريدك الإلكتروني لتأكيد حسابك قبل تسجيل الدخول',
          [
            {
              text: 'حسنًا',
              onPress: () => router.replace('/(auth)/sign-in')
            }
          ]
        );
      } else {
        Alert.alert('خطأ في إنشاء الحساب', 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
      }
    } catch (err: any) {
      console.error('Unexpected Sign Up Exception:', JSON.stringify(err, null, 2));
      Alert.alert('خطأ في إنشاء الحساب', err.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
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
            <StyledText fontWeight="Bold" style={{fontSize: 75, color: '#2563EB', paddingBottom:45,fontFamily:'Pacifico-Regular',paddingTop:5}}>  PodHub</StyledText>
            <StyledText fontWeight="Bold" className='text-3xl font-bold text-center mb-8 '>
              إنشاء حساب
            </StyledText>
            <StyledText className='text-center mb-8'>
           قم بإنشاء حساب جديد  و ابدأ بالاستماع للبودكاست مجانا  
            </StyledText>
            <View className='gap-4'>
              <View>
                <StyledText className='text-sm font-medium  mb-1 text-right'>
                  البريد الإلكتروني
                </StyledText>
                <TextInput
                  className='w-full p-4  bg-gray-100 text-black rounded-full text-right '
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
                <StyledText className='text-sm font-medium  mb-1 text-right'>
                    كلمة المرور
                </StyledText>
                <TextInput
                  className='w-full p-4  bg-gray-100 text-black rounded-full text-right'
                  value={password}
                  placeholder='كلمة المرور'
                  placeholderTextColor='#9CA3AF'
                  secureTextEntry={true}
                  onChangeText={setPassword}
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={onSignUpPress}
                />
              </View>

              <TouchableOpacity
                className={`w-full p-4 rounded-full mt-6 ${loading ? 'bg-gray-400' : 'bg-blue-600'}`}
                onPress={onSignUpPress}
                disabled={loading}
              >
                <StyledText className='text-white text-center font-semibold'>
                  {loading ? 'إنشاء حساب...' : 'إنشاء حساب'}
                </StyledText>
              </TouchableOpacity>
            </View>
            <View className='flex-row justify-center items-center mt-6 gap-2 text-right'>
             
              <Link href='/sign-in'>
                <StyledText className='text-blue-400 font-semibold ml-1'>تسجيل الدخول</StyledText>
              </Link> 
               <StyledText className='text-gray-400'>  هل لديك حساب؟</StyledText>
            </View>
            
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}