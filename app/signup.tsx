import { auth } from "@/firebase";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

export default function SignupScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      alert("Enter your email address and password.");
      return;
    }
    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, normalizedEmail, password);

      alert("Account created ✅");

      router.replace("/(tabs)/home");
    } catch (error: unknown) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String(error.code)
          : "";

      if (code === "auth/invalid-email") {
        alert("Enter a valid email address.");
      } else {
        alert(error instanceof Error ? error.message : "Unable to create account.");
      }
    }
  };

  return (
    <View
      style={{
        flex: 1,
        padding: 20,
        justifyContent: "center",
        backgroundColor: "#11111b",
      }}
    >
      <Text style={{ fontSize: 24, marginBottom: 20, color: "#ffffff" }}>
        Sign Up
      </Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#6b7280"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
        style={{
          borderWidth: 1,
          borderColor: "#9ca3af",
          borderRadius: 8,
          backgroundColor: "#ffffff",
          color: "#111827",
          padding: 12,
          marginBottom: 15,
        }}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#6b7280"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
        style={{
          borderWidth: 1,
          borderColor: "#9ca3af",
          borderRadius: 8,
          backgroundColor: "#ffffff",
          color: "#111827",
          padding: 12,
          marginBottom: 20,
        }}
      />

      <TouchableOpacity
        onPress={handleSignup}
        style={{ backgroundColor: "#00b894", padding: 15 }}
      >
        <Text style={{ color: "white", textAlign: "center" }}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 15 }}>
        <Text style={{ textAlign: "center", color: "#c4b5fd" }}>
          Already have an account? Login
        </Text>
      </TouchableOpacity>
    </View>
  );
}
