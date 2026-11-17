import { auth, db } from "@/firebase";
import { useRouter } from "expo-router";
import { addDoc, collection } from "firebase/firestore";
import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

export default function SetBudget() {
  const router = useRouter();
  const [amount, setAmount] = React.useState("");

  const handleSave = async () => {
    if (!amount) return;

    const month = new Date().toISOString().slice(0, 7);
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    await addDoc(collection(db, "users", uid, "budgets"), {
      totalBudget: Number(amount),
      month,
      createdAt: new Date(),
    });

    router.replace("/(tabs)/BudgetScreen");
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>
        Set Monthly Budget
      </Text>

      <TextInput
        placeholder="Enter amount"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        style={{
          borderWidth: 1,
          padding: 12,
          marginTop: 20,
          borderRadius: 10,
        }}
      />

      <TouchableOpacity
        onPress={handleSave}
        style={{
          backgroundColor: "#6C63FF",
          padding: 14,
          marginTop: 20,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center" }}>Save Budget</Text>
      </TouchableOpacity>
    </View>
  );
}
