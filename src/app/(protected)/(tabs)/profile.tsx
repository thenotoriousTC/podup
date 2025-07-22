import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Pressable, Text, View, Alert } from 'react-native';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { usePlayer } from '@/providers/playerprovider';

export default function Profile() {
        const { user: currentUser, loading: authLoading } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { player, setPodcast } = usePlayer();
    const router = useRouter();

        useEffect(() => {
        if (currentUser) {
            const fetchProfile = async () => {
                setLoading(true);
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', currentUser.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching profile:', error);
                } else {
                    setProfile(data);
                }
                setLoading(false);
            };
            fetchProfile();
        }
    }, [currentUser]);

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

        if (authLoading || loading) {
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
                            {profile?.full_name || currentUser?.email?.split('@')[0] || 'User'}
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
                        className="flex-row items-center justify-between p-4"
                        onPress={() => router.push('/(protected)/UPLOAD')}
                    >
                        <View className="flex-row items-center">
                            <AntDesign name="left" size={24} color="#C7C7CC" />
                            <Ionicons name="cloud-upload-outline" size={32} color="#007AFF" className="ml-2" />
                        </View>
                        <Text className="text-lg text-black text-right">تحميل</Text>
                    </Pressable>

                    <View className="h-px bg-gray-200 mr-14" />

                    <Pressable 
                        className="flex-row items-center justify-between p-4"
                        onPress={() => router.push('/(protected)/downloads')}
                    >
                        <View className="flex-row items-center">
                            <AntDesign name="left" size={24} color="#C7C7CC" />
                            <Ionicons name="cloud-download-outline" size={32} color="#007AFF" className="ml-2" />
                        </View>
                        <Text className="text-lg text-black text-right">التنزيلات</Text>
                    </Pressable>

                    <View className="h-px bg-gray-200 mr-14" />

                    <Pressable 
                        className="flex-row items-center justify-between p-4"
                        onPress={() => {
                            if (currentUser) {
                                router.push(`/(protected)/creator/${currentUser.id}`);
                            }
                        }}
                        disabled={!currentUser}
                    >
                        <View className="flex-row items-center">
                            <AntDesign name="left" size={24} color="#C7C7CC" />
                            <Ionicons name="albums-outline" size={32} color="#007AFF" className="ml-2" />
                        </View>
                        <Text className="text-lg text-black text-right">المحتوى الخاص بي</Text>
                    </Pressable>
                    
                    <View className="h-px bg-gray-200 mr-14" />
                    
                    <Pressable 
                        className="flex-row items-center justify-between p-4" 
                        onPress={handleSignOut}
                    >
                        <View className="flex-row items-center">
                            <AntDesign name="left" size={24} color="#C7C7CC" />
                            <AntDesign name="logout" size={30} color="#007AFF" className="ml-2" />
                        </View>
                        <Text className="text-lg text-black text-right">تسجيل الخروج</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}