import { Redirect, Slot, Tabs } from "expo-router";
import AntDesign from "@expo/vector-icons/AntDesign";
import "../../../../global.css";
import { ActivityIndicator, StyleSheet, View as RNView } from "react-native";
import React from "react";
import { BottomTabBar } from "@react-navigation/bottom-tabs";
import FloatingPlayer from "@/components/floatingPlayer";
import { Ionicons, Octicons } from "@expo/vector-icons";
import LobsterText from "@/components/LobsterText";

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerShadowVisible: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#000000",
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarLabelPosition: "below-icon",
        headerTitleAlign: "center",
        headerTitle: ({ children }) => (
          <LobsterText size={26} color="#007AFF">
            {children}
          </LobsterText>
        ),
      }}
      tabBar={(props) => (
        <RNView style={styles.tabBarContainer}>
          <FloatingPlayer />
          <BottomTabBar
            {...props}
          />
        </RNView>
      )}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          headerTitle: "PodUp",
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="search1" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Library",
          headerTitle: "My Library",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="recording"
        options={{
          title: "Record",
          headerTitle: "Audio Recording",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mic" size={size} color={color} />
          ),
        }}
      /><Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerTitle: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Octicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FFFFFF',
    elevation: 0, // Android
  },
  headerTitle: {
    color: '#007AFF',
    fontSize: 30,
    fontWeight: '600',
    fontFamily: 'Lobster_400Regular',
  },
  tabBarContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    elevation: 0, // Android
    height: 83,
    paddingTop: 5,
    paddingBottom: 30,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});
