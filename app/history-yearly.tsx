import { auth, db } from "@/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import React from "react";
import { Text, View } from "react-native";

export default function YearlyHistory() {
  const [yearData, setYearData] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const unsubscribe = onSnapshot(
      collection(db, "users", uid, "expenses"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => doc.data());

        const grouped: Record<string, number> = {};

        data.forEach((item) => {
          if (!item.date) return;

          const year = item.date.split("-")[0];

          if (!grouped[year]) grouped[year] = 0;

          grouped[year] += Number(item.amount);
        });

        setYearData(grouped);
      },
    );

    return () => unsubscribe();
  }, []);
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>Yearly History</Text>

      {Object.entries(yearData).map(([year, total]) => (
        <View
          key={year}
          style={{
            padding: 12,
            backgroundColor: "#f5f5f5",
            borderRadius: 10,
            marginVertical: 6,
          }}
        >
          <Text>Year: {year}</Text>
          <Text>Total Budget: ₹{total}</Text>
        </View>
      ))}
    </View>
  );
}
