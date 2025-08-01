import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Pressable, Text, View, Alert, Image } from 'react-native';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { usePlayer } from '@/providers/playerprovider';
import { StyledText } from '@/components/StyledText';

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
                <StyledText className="text-lg text-blue-500 text-center">جاري التحميل...</StyledText>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white p-4 pt-10">
            <View className="pb-8 mt-2">
                <StyledText className="text-4xl  text-indigo-500 text-right pb-8">الملف الشخصي</StyledText>
            </View>

            <View className="bg-white rounded-xl p-4 mb-6 shadow-lg">
                <View className="flex-row items-center justify-end">
                    <View className="mr-4">
                        <StyledText className="text-xl font-semibold text-black text-right">
                            {profile?.full_name || currentUser?.email?.split('@')[0] || 'User'}
                        </StyledText>
                        <StyledText className="text-base text-gray-600 opacity-60 mt-1 text-right">
                            {currentUser?.email || 'No email'}
                        </StyledText>
                    </View>
                    <Image
                        source={{ uri: profile?.avatar_url || 'https://i.pinimg.com/736x/c0/74/9b/c0749b7cc401421662ae901ec8f9f660.jpg' }}
                        className="w-16 h-16 rounded-full"
                    />
                </View>
            </View>
            
            <View className="mb-6">
                <StyledText className="text-xl font-semibold text-indigo-500 mb-3 text-right">الحساب</StyledText>
                
                <View className="bg-white rounded-xl shadow-lg">
                    <Pressable 
                        className="flex-row items-center justify-between p-4"
                        onPress={() => router.push('/(protected)/UPLOAD')}
                    >
                        <View className="flex-row items-center">
                            <AntDesign name="left" size={24} color="#C7C7CC" />
                            <Ionicons name="cloud-upload-outline" size={32} color="#4F46E5" className="ml-2" />
                        </View>
                        <StyledText className="text-lg text-black text-right">تحميل</StyledText>
                    </Pressable>

                    <View className="h-px bg-gray-200 mr-14" />

                    <Pressable 
                        className="flex-row items-center justify-between p-4"
                        onPress={() => router.push('/(protected)/downloads')}
                    >
                        <View className="flex-row items-center">
                            <AntDesign name="left" size={24} color="#C7C7CC" />
                            <Ionicons name="cloud-download-outline" size={32} color="#4F46E5" className="ml-2" />
                        </View>
                        <StyledText className="text-lg text-black text-right">التنزيلات</StyledText>
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
                            <Ionicons name="albums-outline" size={32} color="#4F46E5" className="ml-2" />
                        </View>
                        <StyledText className="text-lg text-black text-right">المحتوى الخاص بي</StyledText>
                    </Pressable>
                    
                    <View className="h-px bg-gray-200 mr-14" />

                    <Pressable 
                        className="flex-row items-center justify-between p-4"
                        onPress={() => router.push('/(protected)/creator/create-series')}
                    >
                        <View className="flex-row items-center">
                            <AntDesign name="left" size={24} color="#C7C7CC" />
                            <Ionicons name="duplicate-outline" size={32} color="#4F46E5" className="ml-2" />
                        </View>
                        <StyledText className="text-lg text-black text-right">إنشاء سلسلة جديدة</StyledText>
                    </Pressable>

                    <View className="h-px bg-gray-200 mr-14" />
                    
                    <Pressable 
                        className="flex-row items-center justify-between p-4" 
                        onPress={handleSignOut}
                    >
                        <View className="flex-row items-center">
                            <AntDesign name="left" size={24} color="#C7C7CC" />
                            <AntDesign name="logout" size={30} color="#4F46E5" className="ml-2" />
                        </View>
                        <StyledText className="text-lg text-black text-right">تسجيل الخروج</StyledText>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}