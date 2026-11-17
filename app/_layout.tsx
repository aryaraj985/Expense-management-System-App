import RecordingOverlay from "@/components/RecordingOverlay";
import { auth } from "@/firebase";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [user, setUser] = useState<User | null>(auth.currentUser);

  // ✅ Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return unsubscribe;
  }, []);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} />

      {/* Show only when logged in */}
      {user && <RecordingOverlay />}

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
