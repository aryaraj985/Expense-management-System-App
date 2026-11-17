import { auth, db } from "@/firebase";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import React from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

export default function AllExpensesScreen() {
  const [parsedExpenses, setParsedExpenses] = React.useState<any[]>([]);
  // const { expenses } = useLocalSearchParams();
  const router = useRouter();

  // let parsedExpenses: any[] = [];

  // try {
  //   parsedExpenses = expenses ? JSON.parse(expenses as string) : [];
  // } catch (e) {
  //   parsedExpenses = [];
  // }
  // const [parsedExpenses, setParsedExpenses] = React.useState<any[]>([]);
  React.useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const unsubscribe = onSnapshot(
      collection(db, "users", uid, "expenses"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("📦 ALL EXPENSES:", data);

        setParsedExpenses(data);
      },
    );

    return () => unsubscribe();
  }, []);
  // React.useEffect(() => {
  //   try {
  //     const data = expenses ? JSON.parse(expenses as string) : [];
  //     setParsedExpenses(data);
  //   } catch (e) {
  //     setParsedExpenses([]);
  //   }
  // }, [expenses]);
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Food":
        return <MaterialIcons name="restaurant" size={24} color="#ff8c42" />;
      case "Travel":
        return (
          <MaterialIcons name="directions-car" size={24} color="#6c5ce7" />
        );
      default:
        return <MaterialIcons name="shopping-cart" size={24} color="#00b894" />;
    }
  };

  const getWeekKey = (date: string) => {
    const d = new Date(date);
    const oneJan = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(
      ((+d - +oneJan) / 86400000 + oneJan.getDay() + 1) / 7,
    );
    return `${d.getFullYear()}-W${week}`;
  };

  const deleteExpense = async (expense: any) => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      await deleteDoc(doc(db, "users", uid, "expenses", expense.id));
      const amt = Number(expense.amount);
      const date = expense.date;
      const category = expense.category;

      const dailyRef = doc(db, "users", uid, "dailyTotals", date);
      const dailySnap = await getDoc(dailyRef);

      if (dailySnap.exists()) {
        await updateDoc(dailyRef, {
          total: dailySnap.data().total - amt,
        });
      }

      const weekKey = getWeekKey(date);
      const weekRef = doc(db, "users", uid, "weeklyTotals", weekKey);
      const weekSnap = await getDoc(weekRef);

      if (weekSnap.exists()) {
        await updateDoc(weekRef, {
          total: weekSnap.data().total - amt,
        });
      }

      const catRef = doc(db, "users", uid, "categoryTotals", category);
      const catSnap = await getDoc(catRef);

      if (catSnap.exists()) {
        await updateDoc(catRef, {
          total: catSnap.data().total - amt,
        });
      }

      setParsedExpenses((prev) =>
        prev.filter((item) => item.id !== expense.id),
      );
    } catch (error) {
      console.log("Delete Error:", error);
    }
  };

  const handleEdit = (item: any) => {
    router.push({
      pathname: "/(tabs)/add-expense", // ✅ match your actual file name
      params: {
        expense: JSON.stringify(item),
        isEdit: "true",
      },
    });
  };

  return (
    <View
      style={{
        flex: 1,
        padding: 20,
        paddingTop: 40,
        backgroundColor: "#fff",
      }}
    >
      <Text
        style={{
          fontSize: 22,
          fontWeight: "bold",
          marginBottom: 20,
          color: "#111827",
        }}
      >
        All Transactions
      </Text>

      <FlatList
        data={parsedExpenses}
        keyExtractor={(item, index) => item.id || index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleEdit(item)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#f3f4f6",
              borderWidth: 1,
              borderColor: "#e5e7eb",
              padding: 15,
              borderRadius: 15,
              marginVertical: 8,
            }}
          >
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: "#e5e7eb",
                justifyContent: "center",
                alignItems: "center",
                marginRight: 12,
              }}
            >
              {getCategoryIcon(item.category)}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ color: "#111827", fontSize: 18 }}>
                ₹ {item.amount}
              </Text>
              <Text style={{ color: "#4b5563" }}>{item.title}</Text>

              <View style={{ flexDirection: "row", marginTop: 8, gap: 15 }}>
                <TouchableOpacity onPress={() => handleEdit(item)}>
                  <MaterialIcons name="edit" size={22} color="#00cec9" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => deleteExpense(item)}>
                  <MaterialIcons name="delete" size={22} color="#ff4d4d" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={{ color: "#6b7280", fontSize: 12 }}>{item.date}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
