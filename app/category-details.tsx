import { auth, db } from "@/firebase";
import { useLocalSearchParams } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import React from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CategoryDetails() {
  const { category } = useLocalSearchParams();
  const [expenses, setExpenses] = React.useState<any[]>([]);
  // MOCK DATA (later Firebase)

  const filtered = expenses.filter(
    (exp) => exp.category === category?.toString(),
  );
  React.useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const snapshot = await getDocs(
          collection(db, "users", uid, "expenses"),
        );

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setExpenses(data);
      } catch (err) {
        console.log("Error fetching:", err);
      }
    };

    fetchExpenses();
  }, []);
  return (
    <SafeAreaView
      style={{ flex: 1, padding: 16, backgroundColor: "#ffffff" }}
    >
      <Text style={{ fontSize: 20, fontWeight: "bold", color: "#111827" }}>
        {category?.toString().toUpperCase()} Transactions
      </Text>

      <FlatList
        style={{ backgroundColor: "#ffffff" }}
        contentContainerStyle={{ flexGrow: 1 }}
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 12,
              backgroundColor: "#f5f5f5",
              borderRadius: 10,
              marginVertical: 6,
            }}
          >
            <Text style={{ color: "#111827" }}>₹{item.amount}</Text>
            <Text style={{ color: "#4b5563" }}>{item.date}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
