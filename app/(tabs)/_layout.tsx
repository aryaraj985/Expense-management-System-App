import { Tabs } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

function PlusButton() {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push("/add-expense")}
      style={{
        backgroundColor: "#6c5ce7",
        width: 65,
        height: 65,
        borderRadius: 35,
        justifyContent: "center",
        alignItems: "center",
        elevation: 10,
      }}
    >
      <Feather name="plus" size={28} color="white" />
    </TouchableOpacity>
  );
}

// 🔥 MAIN TAB LAYOUT
export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            backgroundColor: "#1e1e2f",
            borderTopWidth: 0,
            height: 60,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="house.fill" color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="BudgetScreen"
          options={{
            title: "Budget",
            tabBarIcon: ({ color }) => (
              <Feather name="credit-card" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="add-expense"
          options={{
            href: null, // 🔥 THIS HIDES IT
          }}
        />
        <Tabs.Screen
          name="all-expenses"
          options={{
            href: null, // 🔥 hide tab
          }}
        />
      </Tabs>

      {/* 🔥 PERFECT CENTER + BUTTON */}
      <View
        style={{
          position: "absolute",
          bottom: 25, // 🔥 adjust if needed (20–30)
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        <PlusButton />
      </View>
    </View>
  );
}
