import { Redirect, Slot, Tabs } from "expo-router";
import "../../../../global.css";
import { ActivityIndicator, Pressable, StyleSheet, View as RNView } from "react-native";
import React from "react";
import { BottomTabBar, BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import FloatingPlayer from "@/components/floatingPlayer";
import { Entypo, FontAwesome, FontAwesome6, Ionicons, MaterialCommunityIcons, Octicons } from "@expo/vector-icons";
import LobsterText from "@/components/LobsterText";
import { PacificoText } from "@/components/PacificoText";

const CustomTabBarButton = ({ children, onPress }: BottomTabBarButtonProps) => (
  <Pressable onPress={onPress} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
    {children}
  </Pressable>
);

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerShadowVisible: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: "#000000",
        tabBarInactiveTintColor: "#8E8E93",
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarLabelPosition: "below-icon",
        tabBarButton: CustomTabBarButton,
        headerTitleAlign: "center",
        headerTitle: ({ children }) => (
          <PacificoText style={{ color: '#007AFF', fontSize: 30 }}>
            {children}
          </PacificoText>
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
          title: "اكتشف",
          headerTitle: "PodUp",
          tabBarIcon: ({ color, size, focused }) => (
            <Entypo name={focused ? "compass" : "compass"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"                  
        options={{
          title: "المفضلة",
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <FontAwesome name={focused ? "heart" : "heart-o"} size={size} color={color} />
          ),
        }}
      />
             
      <Tabs.Screen
        name="recording"
        options={{
          title: "تسجيل",
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons name={focused ? "microphone" : "microphone-outline"} size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: "الملف الشخصي",
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Octicons name={focused ? "person-fill" : "person"} size={size} color={color} />
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
    borderBottomWidth: 0,
  },
  headerTitle: {
    color: '#007AFF',
    fontSize: 30,
    fontFamily : 'Pacifico-Regular',
  },
  tabBarContainer: {
    backgroundColor: 'white',
    borderRadius: 30,
    marginRight:4,
    marginLeft:4,

    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 1,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
    position:'relative',
    bottom: 10,
  
  },
  tabBar: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    height: 75,
    paddingTop: 5,
    paddingBottom: 5,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
});