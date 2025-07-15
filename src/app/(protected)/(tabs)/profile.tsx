import React from 'react';
import { supabase } from '@/lib/supabase';
import { Pressable, Text, View, Alert } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { usePlayer } from '@/providers/playerprovider';

export default function Profile() {
    const { user: currentUser, loading } = useAuth();
    const { player, setPodcast } = usePlayer();
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            // Stop audio playback before signing out (same logic as floating player)
            await player.pause();
            await player.seekTo(0);
            // Clear the podcast from state
            setPodcast(null);
            
            // Sign out from Supabase
            const { error } = await supabase.auth.signOut();
            if (error) {
                Alert.alert('Error signing out', error.message);
                console.error('Error signing out:', error);
            }
            // Navigation to auth screen will be handled by the root layout's auth state listener
        } catch (error) {
            console.error('Error during sign out:', error);
            // Still try to sign out even if audio stopping fails
            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError) {
                Alert.alert('Error signing out', signOutError.message);
                console.error('Error signing out:', signOutError);
            }
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-100">
                <Text className="text-lg text-blue-500 text-center">Loading...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-100 p-4 pt-10">
            <View className="mb-6 mt-2">
                <Text className="text-4xl font-bold text-blue-500 text-right">الملف الشخصي</Text>
            </View>

            <View className="bg-white rounded-xl p-4 mb-6 shadow-lg">
                <View className="flex-row items-center justify-end">
                    <View>
                        <Text className="text-xl font-semibold text-black text-right">
                            {currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name || currentUser?.email?.split('@')[0] || 'User'}
                        </Text>
                        <Text className="text-base text-gray-600 opacity-60 mt-1 text-right">
                            {currentUser?.email || 'No email'}
                        </Text>
                    </View>
                </View>
            </View>
            
            <View className="mb-6">
                <Text className="text-xl font-semibold text-blue-500 mb-3 text-right">الحساب</Text>
                
                <View className="bg-white rounded-xl shadow-lg">
                    <Pressable 
                        className="flex-row items-center p-4"
                        onPress={() => router.push('/(protected)/UPLOAD')}
                    >
                        <AntDesign name="upload" size={22} color="#007AFF" />
                        <Text className="text-lg ml-4 flex-1 text-black text-right">تحميل</Text>
                        <AntDesign name="right" size={16} color="#C7C7CC" />
                    </Pressable>

                    <View className="h-px bg-gray-200 ml-14" />

                    <Pressable 
                        className="flex-row items-center p-4"
                        onPress={() => router.push('/(protected)/downloads')}
                    >
                        <AntDesign name="download" size={22} color="#007AFF" />
                        <Text className="text-lg ml-4 flex-1 text-black text-right">التنزيلات</Text>
                        <AntDesign name="right" size={16} color="#C7C7CC" />
                    </Pressable>
                    
                    <View className="h-px bg-gray-200 ml-14" />
                    
                    <Pressable className="flex-row items-center p-4" onPress={handleSignOut}>
                        <AntDesign name="logout" size={22} color="#007AFF" />
                        <Text className="text-lg ml-4 flex-1 text-black text-right">تسجيل الخروج</Text>
                        <AntDesign name="right" size={16} color="#C7C7CC" />
                    </Pressable>
                </View>
            </View>
        </View>
    );
}