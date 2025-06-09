import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { Pressable, Text, View, StyleSheet, Image, Alert } from 'react-native';
import { AntDesign } from '@expo/vector-icons';

export default function Profile() {
    const [currentUser, setCurrentUser] = React.useState<User | null>(null);
    const [loading, setLoading] = React.useState(true);

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
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Profile</Text>
            </View>

            
            <View style={styles.card}>
                <View style={styles.userInfo}>
                    <View style={styles.avatarContainer}>
                        <Image 
                            source={{ uri: currentUser?.user_metadata?.avatar_url || currentUser?.user_metadata?.picture || 'https://via.placeholder.com/100' }} 
                            style={styles.avatar} 
                        />
                    </View>
                    <View style={styles.userDetails}>
                        <Text style={styles.userName}>{currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name || currentUser?.email?.split('@')[0] || 'User'}</Text>
                        <Text style={styles.userEmail}>{currentUser?.email || 'No email'}</Text>
                    </View>
                </View>
            </View>
            
            <View style={styles.menuSection}>
                <Text style={styles.sectionTitle}>Account</Text>
                
                <View style={styles.menuCard}>
                    <Pressable style={styles.menuItem}>
                        <AntDesign name="user" size={22} color="#007AFF" />
                        <Text style={styles.menuItemText}>Edit Profile</Text>
                        <AntDesign name="right" size={16} color="#C7C7CC" style={styles.menuArrow} />
                    </Pressable>
                    
                    <View style={styles.divider} />
                    
                    <Pressable style={styles.menuItem}>
                        <AntDesign name="setting" size={22} color="#007AFF" />
                        <Text style={styles.menuItemText}>Settings</Text>
                        <AntDesign name="right" size={16} color="#C7C7CC" style={styles.menuArrow} />
                    </Pressable>
                    
                    <View style={styles.divider} />
                    
                    <Pressable style={styles.menuItem} onPress={handleSignOut}>
                        <AntDesign name="logout" size={22} color="#007AFF" />
                        <Text style={styles.menuItemText}>Sign Out</Text>
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
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
    },
    userDetails: {
        marginLeft: 16,
    },
    userName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
    },
    userEmail: {
        fontSize: 16,
        color: '#3C3C43',
        opacity: 0.6,
        marginTop: 4,
    },
    menuSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#007AFF',
        marginBottom: 12,
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
    },
    menuArrow: {
        marginLeft: 'auto',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E5EA',
        marginLeft: 54,
    },
});