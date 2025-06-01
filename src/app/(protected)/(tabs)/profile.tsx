import React from 'react';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Pressable, Text, View, StyleSheet, Image } from 'react-native';
import { AntDesign } from '@expo/vector-icons';

export default function Profile() {
    const { signOut } = useAuth();
    const { user } = useUser();
    
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Profile</Text>
            </View>
            
            <View style={styles.card}>
                <View style={styles.userInfo}>
                    <View style={styles.avatarContainer}>
                        <Image 
                            source={{ uri: user?.imageUrl || 'https://via.placeholder.com/100' }} 
                            style={styles.avatar} 
                        />
                    </View>
                    <View style={styles.userDetails}>
                        <Text style={styles.userName}>{user?.fullName || 'User'}</Text>
                        <Text style={styles.userEmail}>{user?.primaryEmailAddress?.emailAddress || 'No email'}</Text>
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
                    
                    <Pressable style={styles.menuItem} onPress={() => signOut()}>
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