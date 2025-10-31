import React, { useState } from 'react';
import { Pressable } from '@/components/Pressable';
import { View, Alert, Image } from 'react-native';;
import { TouchableOpacity } from '@/components/TouchableOpacity';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { usePlayer } from '@/providers/playerprovider';
import { StyledText } from '@/components/StyledText';
import SuggestionModal from '@/components/profile/SuggestionModal';

export default function Profile() {
    const { user: currentUser, loading: authLoading } = useAuth();
    const [modalVisible, setModalVisible] = useState(false);
    const { setPodcast } = usePlayer();
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: ['profile', currentUser?.id],
        queryFn: async () => {
            if (!currentUser) return null;
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .single();
            if (error && error.code !== 'PGRST116') {
                throw new Error(error.message);
            }
            return data;
        },
        enabled: !!currentUser,
    });

    const handleSignOut = async () => {
        let signOutSucceeded = false;
        try {
            // Stop any current playback and clear podcast state
            setPodcast(null);
            // Ensure no in-flight queries keep running with the old session
            await queryClient.cancelQueries();
            const { error } = await supabase.auth.signOut();
            signOutSucceeded = !error;
            if (error) {
                Alert.alert('Error signing out', error.message);
            }
        } catch (err) {
            console.error('Error during sign out:', err);
            // Attempt to sign out even if pre-logout steps failed
            const { error: signOutError } = await supabase.auth.signOut();
            signOutSucceeded = !signOutError;
            if (signOutError) {
                Alert.alert('Error signing out', signOutError.message);
            }
        } finally {
            // Only clear query cache if the user actually signed out
            if (signOutSucceeded) {
                queryClient.clear();
                // If you persist the cache, also clear persisted storage:
                // await persister.removeClient?.();
            }
        }
    };

    if (authLoading || profileLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-100">
                <StyledText className="text-lg text-[#FD842B] text-center">جاري التحميل...</StyledText>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white p-4 pt-10">
            <View className="pb-8 mt-2">
                <StyledText className="text-4xl text-[#FD842B] text-right pb-8">الملف الشخصي</StyledText>
            </View>

            <View className="bg-white rounded-xl p-4 mb-6 shadow-lg">
                <View className="flex-row items-center justify-end">
                    <TouchableOpacity 
                        className="mr-4 flex-1" 
                        onPress={() => router.push('/(protected)/edit-profile')}
                        activeOpacity={0.7}
                    >
                        <StyledText className="text-xl font-semibold text-black text-right">
                            {profile?.full_name || currentUser?.email?.split('@')[0] || 'User'}
                        </StyledText>
                        <StyledText className="text-base text-gray-600 opacity-60 mt-1 text-right">
                            {currentUser?.email || 'No email'}
                        </StyledText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => router.push('/(protected)/edit-profile')}
                        activeOpacity={0.7}
                    >
                        <Image
                            source={{ uri: profile?.avatar_url || 'https://i.pinimg.com/736x/c0/74/9b/c0749b7cc401421662ae901ec8f9f660.jpg' }}
                            className="w-16 h-16 rounded-full"
                        />
                    </TouchableOpacity>
                </View>
            </View>
            
            <View className="mb-6">
                <StyledText className="text-xl font-semibold text-[#FD842B] mb-3 text-right">الحساب</StyledText>
                
                <View className="bg-white rounded-xl shadow-lg">
                    {/* Upload Button */}
                    <Pressable 
                    android_disableSound={true}
                    className="flex-row items-center justify-between p-4" onPress={() => router.push('/(protected)/UPLOAD')}>
                        <View className="flex-row items-center">
                            <AntDesign name="left" size={24} color="#C7C7CC" />
                            <Ionicons name="cloud-upload-outline" size={32} color="#FD842B" className="ml-2" />
                        </View>
                        <StyledText className="text-lg text-black text-right">تحميل</StyledText>
                    </Pressable>

                    <View className="h-px bg-gray-200 mr-14" />

                    {/* Downloads Button */}
                    <Pressable className="flex-row items-center justify-between p-4" onPress={() => router.push('/(protected)/downloads')}>
                        <View className="flex-row items-center">
                            <AntDesign name="left" size={24} color="#C7C7CC" />
                            <Ionicons name="cloud-download-outline" size={32} color="#FD842B" className="ml-2" />
                        </View>
                        <StyledText className="text-lg text-black text-right">التنزيلات</StyledText>
                    </Pressable>

                    <View className="h-px bg-gray-200 mr-14" />

                    {/* My Content Button */}
                    <Pressable className="flex-row items-center justify-between p-4" onPress={() => { if (currentUser) { router.push(`/(protected)/creator/${currentUser.id}`); } }} disabled={!currentUser}>
                        <View className="flex-row items-center">
                            <AntDesign name="left" size={24} color="#C7C7CC" />
                            <Ionicons name="albums-outline" size={32} color="#FD842B" className="ml-2" />
                        </View>
                        <StyledText className="text-lg text-black text-right">المحتوى الخاص بي</StyledText>
                    </Pressable>
                    
                    <View className="h-px bg-gray-200 mr-14" />

                    {/* Create Series Button */}
                    <Pressable className="flex-row items-center justify-between p-4" onPress={() => router.push('/(protected)/creator/create-series')}>
                        <View className="flex-row items-center">
                            <AntDesign name="left" size={24} color="#C7C7CC" />
                            <Ionicons name="duplicate-outline" size={32} color="#FD842B" className="ml-2" />
                        </View>
                        <StyledText className="text-lg text-black text-right">إنشاء سلسلة جديدة</StyledText>
                    </Pressable>

                    <View className="h-px bg-gray-200 mr-14" />

                    {/* Suggestions Button */}
                    <Pressable className="flex-row items-center justify-between p-4" onPress={() => setModalVisible(true)}>
                        <View className="flex-row items-center">
                            <AntDesign name="left" size={24} color="#C7C7CC" />
                            <Ionicons name="bulb-outline" size={32} color="#FD842B" className="ml-2" />
                        </View>
                        <StyledText className="text-lg text-black text-right">اقتراحات</StyledText>
                    </Pressable>

                    <View className="h-px bg-gray-200 mr-14" />
                    
                    {/* Sign Out Button */}
                    <Pressable className="flex-row items-center justify-between p-4" onPress={handleSignOut}>
                        <View className="flex-row items-center">
                            <AntDesign name="left" size={24} color="#C7C7CC" />
                            <AntDesign name="logout" size={30} color="#FD842B" className="ml-2" />
                        </View>
                        <StyledText className="text-lg text-black text-right">تسجيل الخروج</StyledText>
                    </Pressable>
                </View>
            </View>

            <SuggestionModal 
                visible={modalVisible} 
                onClose={() => setModalVisible(false)} 
            />
        </View>
    );
}