import * as React from 'react';
import {Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Link, useRouter } from 'expo-router';

export default function SignUpScreen() {
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState('');
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
        Alert.alert('Sign Up Error', error.message);
        console.error('Supabase Sign Up Error:', error.message);
      } else if (data.user) {
        // User created, Supabase sends verification email (with OTP ideally)
        setPendingVerification(true);
      } else {
        Alert.alert('Sign Up Error', 'An unexpected issue occurred. Please try again.');
      }
    } catch (err: any) {
      console.error('Unexpected Sign Up Exception:', JSON.stringify(err, null, 2));
      Alert.alert('Sign Up Error', err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: emailAddress, // Make sure emailAddress is still available in this scope
        token: code,
        type: 'signup',
      });

      if (error) {
        Alert.alert('Verification Error', error.message);
        console.error('Supabase Verification Error:', error.message);
      } else if (data.session && data.user) {
        // Verification successful, user is logged in.
        // Redirection will be handled by layout listeners, or navigate immediately:
        router.replace('/(protected)');
      } else {
        Alert.alert('Verification Error', 'Could not verify OTP. Please try again.');
      }
    } catch (err: any) {
      console.error('Unexpected Verification Exception:', JSON.stringify(err, null, 2));
      Alert.alert('Verification Error', err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <View className='flex-1 bg-gray-900 p-6'>
        <View className='flex-1 justify-center'>
          <Text className='text-3xl font-bold text-center mb-8 text-white'>
            Verify Your Email
          </Text>

          <View className='gap-4'>
            <View>
              <Text className='text-sm font-medium text-gray-300 mb-1'>
                Verification Code
              </Text>
              <TextInput
                className='w-full p-4 border border-gray-700 rounded-lg bg-gray-800 text-white'
                value={code}
                placeholder='Enter your verification code'
                placeholderTextColor='#9CA3AF'
                onChangeText={setCode}
              />
            </View>

            <TouchableOpacity
              className={`w-full p-4 rounded-lg mt-6 ${loading ? 'bg-gray-400' : 'bg-blue-600'}`}
              onPress={onVerifyPress}
              disabled={loading}
            >
              <Text className='text-white text-center font-semibold'>
                {loading ? 'Verifying...' : 'Verify Email'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className='flex-1  p-6'>
      <View className='flex-1 justify-center'>
        <Text className='text-3xl font-bold text-center mb-8 '>
          Create Account
        </Text>

        <View className='gap-4'>
          <View>
            <Text className='text-sm font-medium  mb-1'>
              Email
            </Text>
            <TextInput
              className='w-full p-4 border border-gray-200 rounded-lg '
              autoCapitalize='none'
              value={emailAddress}
              placeholder='Enter email'
              placeholderTextColor='#9CA3AF'
              onChangeText={setEmailAddress}
            />
          </View>

          <View>
            <Text className='text-sm font-medium  mb-1'>
              Password
            </Text>
            <TextInput
              className='w-full p-4 border border-gray-200 rounded-lg '
              value={password}
              placeholder='Enter password'
              placeholderTextColor='#9CA3AF'
              secureTextEntry={true}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            className={`w-full p-4 rounded-lg mt-6 ${loading ? 'bg-gray-400' : 'bg-blue-600'}`}
            onPress={onSignUpPress}
            disabled={loading}
          >
            <Text className='text-white text-center font-semibold'>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        </View>

        <View className='flex-row justify-center items-center mt-6 gap-2'>
          <Text className='text-gray-400'>Already have an account?</Text>
          <Link href='/sign-in'>
            <Text className='text-blue-400 font-semibold ml-1'>Sign in</Text>
          </Link>
        </View>
      </View>
    </View>
  );
}
