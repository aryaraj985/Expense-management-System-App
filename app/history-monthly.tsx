import { auth, db } from "@/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import React from "react";
import { FlatList, Text, View } from "react-native";

export default function MonthlyHistory() {
  const [budgets, setBudgets] = React.useState<any[]>([]);

  React.useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const unsubscribe = onSnapshot(
      collection(db, "users", uid, "expenses"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => doc.data());

        const grouped: any = {};

        data.forEach((item) => {
          if (!item.date) return;

          const month = item.date.slice(0, 7); // "2026-04"

          if (!grouped[month]) grouped[month] = 0;

          grouped[month] += Number(item.amount);
        });

        const result = Object.entries(grouped).map(([month, total]) => ({
          month,
          total,
        }));

        setBudgets(result);
      },
    );

    return () => unsubscribe();
  }, []);
  const formatMonth = (month: string) => {
    const [year, m] = month.split("-");
    const date = new Date(Number(year), Number(m) - 1);

    return date.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
  };
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>Monthly History</Text>

      <FlatList
        data={budgets}
        keyExtractor={(item) => item.month}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 12,
              backgroundColor: "#f5f5f5",
              borderRadius: 10,
              marginVertical: 6,
            }}
          >
            <Text>{formatMonth(item.month)}</Text>
            <Text>spent: ₹{item.total}</Text>
          </View>
        )}
      />
    </View>
  );
}
