import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { Pressable, Text, View, StyleSheet, Image, Alert } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Profile() {
    const [currentUser, setCurrentUser] = React.useState<User | null>(null);
    const [loading, setLoading] = React.useState(true);
    const router = useRouter();

    React.useEffect(() => {
        const fetchUser = async () => {
            setLoading(true);
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) {
                Alert.alert('Error fetching user', error.message);
                console.error('Error fetching user:', error);
            } else {
                setCurrentUser(user);
            }
            setLoading(false);
        };
        fetchUser();
    }, []);

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            Alert.alert('Error signing out', error.message);
            console.error('Error signing out:', error);
        }
        // Navigation to auth screen will be handled by the root layout's auth state listener
    };

    return (
        <View style={styles.container} className='pt-10 align-center '>
            <View style={styles.header} className='text-right'>
                <Text style={styles.title}>الملف الشخصي</Text>
            </View>

            
            <View style={styles.card}>
                <View style={styles.userInfo}>
                    
                    <View >
                        <Text style={styles.userName}>{currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name || currentUser?.email?.split('@')[0] || 'User'}</Text>
                        <Text style={styles.userEmail}>{currentUser?.email || 'No email'}</Text>
                    </View>
                </View>
            </View>
            
            <View style={styles.menuSection}>
                <Text style={styles.sectionTitle}>الحساب</Text>
                
                <View style={styles.menuCard}>
                   
                    
                    
                    
                    
                    
                    
                    <Pressable 
                        style={styles.menuItem}
                        onPress={() => router.push('/(protected)/UPLOAD')}
                    >
                        <AntDesign name="upload" size={22} color="#007AFF" />
                        <Text style={styles.menuItemText}>  تحميل  </Text>
                        <AntDesign name="right" size={16} color="#C7C7CC" style={styles.menuArrow} />
                    </Pressable>

                    <View style={styles.divider} />

                    <Pressable 
                        style={styles.menuItem}
                        onPress={() => router.push('/(protected)/downloads')}
                    >
                        <AntDesign name="download" size={22} color="#007AFF" />
                        <Text style={styles.menuItemText}>التنزيلات</Text>
                        <AntDesign name="right" size={16} color="#C7C7CC" style={styles.menuArrow} />
                    </Pressable>
                    
                    <View style={styles.divider} />
                    
                    <Pressable style={styles.menuItem} onPress={handleSignOut}>
                        <AntDesign name="logout" size={22} color="#007AFF" />
                        <Text style={styles.menuItemText}>تسجيل الخروج</Text>
                        <AntDesign name="right" size={16} color="#C7C7CC" style={styles.menuArrow} />
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
        padding: 16,
    },
    header: {
        marginBottom: 24,
        marginTop: 8,
    },
    title: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#007AFF',
        textAlign: 'right',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginRight: 0,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        textAlign: 'right',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    avatarContainer: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    avatar: {
        height: 70,
        borderRadius: 35,
    },

    userName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
        textAlign: 'right',
    },
    userEmail: {
        fontSize: 16,
        color: '#3C3C43',
        opacity: 0.6,
        marginTop: 4,
        textAlign: 'right',

    },
    menuSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#007AFF',
        marginBottom: 12,
        textAlign: 'right',
    },
    menuCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    menuItemText: {
        fontSize: 17,
        marginLeft: 16,
        flex: 1,
        color: '#000',
        textAlign: 'right',
    },
    menuArrow: {
        marginLeft: 'auto',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E5EA',
        marginLeft: 54,
        textAlign: 'right',
    },
});