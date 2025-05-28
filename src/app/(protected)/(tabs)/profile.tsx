import React from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { Button, Text, View } from 'react-native';

export default function profile() {
    const {signOut} = useAuth();
  return (

    <View>
    <Text className='text-2xl font-bold text-center mt-4'>Profile</Text>
    <Button title='Sign Up' onPress={
    () => { signOut()}  }
    />
    </View>
  )
}