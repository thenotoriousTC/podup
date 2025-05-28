import { Redirect, Slot, Tabs } from "expo-router";
import AntDesign from "@expo/vector-icons/AntDesign";
import "../../../../global.css";
import { useAuth } from "@clerk/clerk-expo";
import { ActivityIndicator } from "react-native";
import { View } from "react-native-reanimated/lib/typescript/Animated";
import React from "react";
import { BottomTabBar } from "@react-navigation/bottom-tabs";
import FloatingPlayer from "@/components/floatingPlayer";

export default function RootLayout() {
  return (
    <Tabs
    tabBar={(props) => (
      <>
<FloatingPlayer/>
<BottomTabBar
{...props}
/>
      </>
    )}
    
    >











      <Tabs.Screen
        name="index"
        options={{
          title: "Home",

          tabBarIcon: ({ color, size }) => (
            <AntDesign name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="search1" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
