import "../../global.css";
import {
  DarkTheme,
  ThemeProvider,
  DefaultTheme,
} from "@react-navigation/native";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from '@clerk/clerk-expo/token-cache'

import { Slot } from "expo-router";
export default function RootLayout() {
  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: "black",
      background: "white",
      card: "#f8f8f8",
      text: "#000000",
      border: "#dddddd",
      notification: "#ff453a",
    },
  };

  return (
    <ThemeProvider value={theme}>
      
      <ClerkProvider  tokenCache={tokenCache} >
        <Slot />
      </ClerkProvider>
    </ThemeProvider>
  )
}
