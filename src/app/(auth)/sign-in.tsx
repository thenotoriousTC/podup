import { useSignIn } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import React from 'react';

export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter()

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return 

    // Start the sign-in process using the email and password provided
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      })

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace('/');
      } else {
        // If the status isn't complete, check why. User might need to
        // complete further steps.
              Alert.alert('Sign In Error', 'Sign in could not be completed. Please try again.')

        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      
      console.error(JSON.stringify(err, null, 2));
    }
  }

  return (
    <View className='flex-1 p-5'>
      <View className='flex-1 justify-center'>
        <Text className='text-3xl font-bold text-center mb-8 '>
          Welcome Back
        </Text>

        <View className='gap-4'>
          <View>
            <Text className='text-sm font-medium  mb-1'>
              Email
            </Text>
            <TextInput
              className='w-full p-4 border border-gray-100 rounded-lg '
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
              className='w-full p-4 border border-gray-100 rounded-lg '
              value={password}
              placeholder='Enter password'
              placeholderTextColor='#9CA3AF'
              secureTextEntry={true}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            className='w-full bg-blue-600 p-4 rounded-lg mt-6'
            onPress={onSignInPress}
          >
            <Text className='text-white text-center font-semibold'>
              Sign In
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
    </View>
  )
}
