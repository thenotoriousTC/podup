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

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailAddress,
        password: password,
      });

      if (error) {
        Alert.alert('Sign In Error', error.message);
        console.error('Supabase Sign In Error:', error.message);
      } else if (data.session) {
        router.replace('/(protected)');
      } else {
        Alert.alert('Sign In Error', 'An unexpected error occurred during sign in.');
      }
    } catch (err: any) {
      console.error('Unexpected Sign In Exception:', JSON.stringify(err, null, 2));
      Alert.alert('Sign In Error', err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className='flex-1'>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
              Welcome Back
            </Text>

            <View className='gap-4'>
              <View>
                <Text className='text-sm font-medium mb-1'>
                  Email
                </Text>
                <TextInput
                  className='w-full p-4 border border-gray-100 rounded-lg'
                  autoCapitalize='none'
                  value={emailAddress}
                  placeholder='Enter email'
                  placeholderTextColor='#9CA3AF'
                  onChangeText={setEmailAddress}
                  keyboardType="email-address"
                  autoComplete="email"
                  returnKeyType="next"
                />
              </View>

              <View>
                <Text className='text-sm font-medium mb-1'>
                  Password
                </Text>
                <TextInput
                  className='w-full p-4 border border-gray-100 rounded-lg'
                  value={password}
                  placeholder='Enter password'
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
                  {loading ? 'Signing In...' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </View>

            <View className='flex-row justify-center items-center mt-6 gap-2'>
              <Text className='text-gray-400'>Don't have an account?</Text>
              <Link href='/sign-up'>
                <Text className='text-blue-400 font-semibold ml-1'>Sign up</Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}