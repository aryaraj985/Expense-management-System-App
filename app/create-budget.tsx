import { auth, db } from "@/firebase";
import { useRouter } from "expo-router";
// import { addDoc, collection } from "firebase/firestore";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function CreateBudget() {
  const router = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  // ✅ suggestions
  const suggestions = ["Food", "Travel", "Rent", "Shopping", "EMI", "Savings"];

  const addCategory = () => {
    if (!name || !amount) return;

    setCategories([...categories, { name, budget: Number(amount) }]);

    setName("");
    setAmount("");
  };
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const saveBudget = async () => {
    const docRef = doc(db, "users", uid, "budgets", "main");

    // 🔥 GET EXISTING DATA
    const existingDoc = await getDoc(docRef);

    let existingCategories: any[] = [];

    if (existingDoc.exists()) {
      existingCategories = existingDoc.data().categories || [];
    }

    // 🔥 MERGE OLD + NEW (NO DUPLICATES)
    const mergedMap: Record<string, number> = {};

    // old categories
    existingCategories.forEach((c: any) => {
      mergedMap[c.name.toLowerCase()] = c.budget;
    });

    // new categories
    categories.forEach((c: any) => {
      const key = c.name.toLowerCase();

      if (mergedMap[key]) {
        mergedMap[key] += c.budget; // ✅ ADD if exists
      } else {
        mergedMap[key] = c.budget;
      }
    });

    // 🔥 FINAL ARRAY
    const finalCategories = Object.keys(mergedMap).map((key) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      budget: mergedMap[key],
    }));

    const totalBudget = finalCategories.reduce((sum, c) => sum + c.budget, 0);

    // 🔥 SAVE MERGED DATA
    await setDoc(docRef, {
      categories: finalCategories,
      totalBudget,
      createdAt: new Date(),
    });

    router.replace("/(tabs)/BudgetScreen");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Budget</Text>

      {/* CATEGORY INPUT */}
      <TextInput
        placeholder="Category"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      {/* AMOUNT INPUT */}
      <TextInput
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        style={styles.input}
      />

      {/* ✅ SUGGESTIONS */}
      <View style={styles.suggestionContainer}>
        {suggestions.map((item: string) => (
          <TouchableOpacity
            key={item}
            onPress={() => setName(item)}
            style={styles.suggestionChip}
          >
            <Text>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ADD CATEGORY */}
      <TouchableOpacity style={styles.addBtn} onPress={addCategory}>
        <Text style={{ color: "#fff" }}>Add Category</Text>
      </TouchableOpacity>

      {/* CATEGORY LIST */}
      {categories.map((c, i) => (
        <Text key={i}>
          {c.name} - ₹{c.budget}
        </Text>
      ))}

      {/* SAVE */}
      <TouchableOpacity style={styles.saveBtn} onPress={saveBudget}>
        <Text style={{ color: "#fff" }}>Generate Budget</Text>
      </TouchableOpacity>
    </View>
  );
}

// ✅ FIX: STYLES ADDED
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 50,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
  },
  suggestionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  suggestionChip: {
    backgroundColor: "#eee",
    padding: 8,
    borderRadius: 8,
    margin: 5,
  },
  addBtn: {
    backgroundColor: "#6c5ce7",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
  },
  saveBtn: {
    backgroundColor: "green",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
});
