import { View } from "react-native";
import { Redirect, Slot, Stack } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { ActivityIndicator } from "react-native";
import { FadeInDown } from "react-native-reanimated";

export default function ProtectedLayout() {
   const { isSignedIn ,isLoaded} = useAuth()
    if (!isLoaded) {
        return <ActivityIndicator/>
    }
      if (!isSignedIn) {
        return <Redirect href={'/sign-in'} />
      }
      return (
        <View className="flex-1">
          <Stack    
          >
          <Stack.Screen
          name="(tabs)" options={{headerShown:false}} />
          
          <Stack.Screen
          name="player" options={{headerShown:false,animation:'fade_from_bottom'}} />
          
        
          
          </Stack>
        </View>
      );
}