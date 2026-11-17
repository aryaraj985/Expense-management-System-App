import { auth, db } from "@/firebase";
import { Feather } from "@expo/vector-icons";
import { collection, doc, onSnapshot } from "firebase/firestore";
// import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Progress from "react-native-progress";
type Budget = {
  id: string;
  totalBudget: number;
  categories: { name: string; budget: number }[];
  createdAt: any;
};
const BudgetScreen = () => {
  const router = useRouter();

  // ✅ STATE (TOP)
  // const [totalBudget, setTotalBudget] = React.useState<number | null>(null);
  const [expenses, setExpenses] = React.useState<any[]>([]);
  // const [budgets, setBudgets] = React.useState<Budget[]>([]);
  const [budgetData, setBudgetData] = React.useState<Budget | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [selectedMonth, setSelectedMonth] = React.useState("April 2026");
  const getMonthKey = (month: string) => {
    const [name, year] = month.split(" ");

    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const monthIndex = months.indexOf(name);

    return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
  };
  const [showMonthDropdown, setShowMonthDropdown] = React.useState(false);
  const months = [
    "January 2026",
    "February 2026",
    "March 2026",
    "April 2026",
    "May 2026",
    "June 2026",
    "July 2026",
    "August 2026",
    "September 2026",
    "October 2026",
    "November 2026",
    "December 2026",
  ];
  // React.useEffect(() => {
  //   const unsubscribe = onSnapshot(collection(db, "expenses"), (snapshot) => {
  //     const data = snapshot.docs.map((doc) => ({
  //       id: doc.id,
  //       ...doc.data(),
  //     }));

  //     setExpenses(data); // ✅ ONLY THIS
  //   });

  //   return () => unsubscribe();
  // }, []);
  React.useEffect(() => {
    // 🔥 FETCH BUDGET
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const unsubBudget = onSnapshot(
      doc(db, "users", uid, "budgets", getMonthKey(selectedMonth)),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = {
            id: docSnap.id,
            ...(docSnap.data() as Omit<Budget, "id">),
          };

          setBudgetData(data);
        } else {
          setBudgetData(null);
        }

        setLoading(false);
      },
    );

    // 🔥 FETCH EXPENSES
    const unsubExpenses = onSnapshot(
      collection(db, "users", uid, "expenses"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setExpenses(data);
      },
    );

    return () => {
      unsubBudget();
      unsubExpenses();
    };
  }, [selectedMonth]);

  console.log("Budget Data:", budgetData);

  //   if (loading) {
  //     return (
  //       <View style={styles.container}>
  //         {showMonthDropdown && (
  //   <TouchableOpacity
  //     activeOpacity={1}
  //     onPress={() => setShowMonthDropdown(false)}
  //     style={{
  //       position: "absolute",
  //       top: 0,
  //       left: 0,
  //       right: 0,
  //       bottom: 0,
  //       zIndex: 100,
  //     }}
  //   />
  // )}
  //         <Text>Loading...</Text>
  //       </View>
  //     );
  //   }

  console.log("finding categories");
  // const categories = budgetData?.categories || [];

  const handleCategoryPress = (category: string) => {
    router.push({
      pathname: "/category-details",
      params: { category },
    });
  };
  console.log("handle category press declared");

  // ✅ CALCULATIONS (AFTER STATE)
  // ✅ CALCULATIONS (FINAL CLEAN VERSION)

  // Total spent from all expenses
  const monthKey = getMonthKey(selectedMonth);

  const filteredExpenses = (expenses || []).filter((exp) => {
    // 🔥 AUTO CALCULATED BUDGET (fallback)

    return exp?.date?.startsWith(monthKey);
  });
  // 🔥 AUTO CALCULATED BUDGET (fallback)
  const totalBudget = budgetData?.totalBudget || 0;
  // 🔥 STEP 1: categories from THIS MONTH expenses
  const expenseCategories = [
    ...new Set((filteredExpenses || []).map((e) => e?.category)),
  ].filter(Boolean);
  // 🔥 GET BUDGET CATEGORIES ALSO
  const budgetCategories =
    budgetData?.categories?.map((c: any) => c.name) || [];

  // 🔥 MERGE BOTH (IMPORTANT)
  const allCategories = [
    ...new Set([...expenseCategories, ...budgetCategories]),
  ];

  // 🔥 STEP 2: merge with budget categories
  const categories = allCategories.map((cat) => {
    const found = budgetData?.categories?.find(
      (c: any) => c.name.toLowerCase() === cat.toLowerCase(),
    );

    return {
      name: cat || "Other",
      budget: found ? found.budget : 0,
    };
  });
  const totalSpent = filteredExpenses.reduce(
    (sum, exp) => sum + Number(exp.amount),
    0,
  );

  // Remaining budget
  const remaining = totalBudget > 0 ? totalBudget - totalSpent : 0;

  // Progress for circle (0 to 1)
  const progress = totalBudget > 0 ? Math.max(0, remaining / totalBudget) : 0;

  // Expenses grouped by category
  const expensesByCategory: Record<string, number> = {};

  filteredExpenses.forEach((exp: any) => {
    const cat = exp.category?.toLowerCase().trim() || "other";

    if (!expensesByCategory[cat]) {
      expensesByCategory[cat] = 0;
    }

    expensesByCategory[cat] += Number(exp.amount);
  });

  // Category analysis (budget vs spent)
  const categoryAnalysis = categories.map((catObj: any) => {
    const cat = catObj.name.toLowerCase().trim();
    const limit = catObj.budget;

    const spent = expensesByCategory[cat] || 0;
    const ratio = limit > 0 ? spent / limit : 0;

    let status = "good";
    if (ratio > 1) status = "overspent";
    else if (ratio > 0.8) status = "warning";

    return {
      category: catObj.name, // keep original name
      spent,
      limit,
      ratio,
      status,
    };
  });

  // ✅ ALERTS (OUTSIDE)
  const alerts: string[] = [];

  // 🔥 1. Overspending alerts
  categoryAnalysis.forEach((item) => {
    if (item.status === "overspent") {
      alerts.push(`⚠️ Overspending on ${item.category}`);
    }
  });

  // 🔥 2. EMI Reminder
  const emiCategory = categories.find(
    (c: any) => c.name.toLowerCase() === "emi",
  );

  if (emiCategory) {
    alerts.push(
      `📅 EMI Reminder: Keep ₹${emiCategory.budget} ready this month`,
    );
  }

  // 🔥 3. Savings check
  const savingsCategory = categories.find(
    (c: any) => c.name.toLowerCase() === "savings",
  );

  if (savingsCategory && savingsCategory.budget < totalBudget * 0.1) {
    alerts.push("⚠️ Your savings are too low. Try saving more.");
  }
  return (
    <View style={styles.container}>
      {showMonthDropdown && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowMonthDropdown(false)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 100,
          }}
        />
      )}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={styles.title}>Budget</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
          <TouchableOpacity onPress={() => setShowNotifications(true)}>
            <View>
              <Text style={{ fontSize: 22 }}>🔔</Text>

              {alerts.length > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -2,
                    backgroundColor: "red",
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                  }}
                />
              )}
            </View>
          </TouchableOpacity>
          {/* ➕ NEW BUTTON */}
          {/* <TouchableOpacity onPress={() => router.push("/create-budget")}>
            <Text style={{ fontSize: 26 }}>＋</Text>
          </TouchableOpacity> */}
        </View>
      </View>
      {/* SUMMARY */}
      <View style={styles.summaryCard}>
        <TouchableOpacity
          onPress={() => setShowMonthDropdown(!showMonthDropdown)}
          style={{ alignItems: "center", marginBottom: 10 }}
        >
          <Text style={styles.monthText}>{selectedMonth} ▼</Text>
        </TouchableOpacity>
        {/* {showMonthDropdown && (
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowMonthDropdown(false)}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 100,
            }}
          />
        )} */}
        {showMonthDropdown && (
          <View
            style={{
              position: "absolute",
              top: 70,
              alignSelf: "center",
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 10,
              elevation: 8,
              width: "80%",
              zIndex: 200,
            }}
          >
            {months.map((month) => (
              <TouchableOpacity
                key={month}
                onPress={() => {
                  setSelectedMonth(month);
                  setShowMonthDropdown(false);
                }}
                style={{
                  padding: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#eee",
                }}
              >
                <Text>{month}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Progress.Circle
            size={120}
            progress={progress}
            showsText
            formatText={() =>
              remaining < 0
                ? "Over\nspent" // 🔥 split into 2 lines
                : `${Math.round(progress * 100)}%\nLeft`
            }
            color={remaining < 0 ? "red" : "green"} // ✅ FIX
          />
          <View style={{ marginLeft: 20 }}>
            <Text>Total Budget: ₹{totalBudget || 0}</Text>
            <Text>Total Spent: ₹{totalSpent || 0}</Text>
            <Text>Available: ₹{remaining || 0}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => router.push("/budget-history")}
        >
          <Text>View Budget History</Text>
        </TouchableOpacity>
      </View>
      {showNotifications && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowNotifications(false)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.3)",
            justifyContent: "flex-start",
            alignItems: "center",
            paddingTop: 100,
            zIndex: 100,
          }}
        >
          <View
            style={{
              width: "85%",
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 15,
              elevation: 10,
            }}
          >
            <Text style={{ fontWeight: "bold", marginBottom: 10 }}>
              Notifications
            </Text>

            {alerts.length === 0 ? (
              <Text>No alerts 🎉</Text>
            ) : (
              alerts.map((alert, index) => (
                <Text key={index} style={{ marginBottom: 8 }}>
                  {alert}
                </Text>
              ))
            )}

            <TouchableOpacity
              onPress={() => setShowNotifications(false)}
              style={{ marginTop: 10 }}
            >
              <Text style={{ color: "#6c5ce7" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
      {/* CATEGORY LIST */}
      <Text style={styles.sectionTitle}>Category-wise Breakdown</Text>
      <FlatList
        data={categoryAnalysis}
        keyExtractor={(item) => item.category}
        renderItem={({ item }) => {
          const color =
            item.status === "overspent"
              ? "red"
              : item.status === "warning"
                ? "orange"
                : "green";

          return (
            <TouchableOpacity
              style={styles.categoryCard}
              onPress={() => handleCategoryPress(item.category)}
            >
              <View style={styles.rowBetween}>
                <Text style={styles.catTitle}>
                  {item.category.toUpperCase()}
                </Text>
                <Text>
                  ₹{item.spent} / ₹{item.limit}
                </Text>
              </View>

              <Progress.Bar
                progress={Math.min(item.ratio, 1)}
                width={null}
                color={color}
                style={{ marginTop: 8 }}
              />

              {item.status === "overspent" && (
                <Text
                  style={{
                    color: "red",
                    marginTop: 6,
                    textAlign: "right",
                    fontWeight: "600",
                  }}
                >
                  Overspent
                </Text>
              )}

              {item.status === "warning" && (
                <Text
                  style={{
                    color: "orange",
                    marginTop: 6,
                    textAlign: "right",
                    fontWeight: "600",
                  }}
                >
                  Near limit ⚠️
                </Text>
              )}
            </TouchableOpacity>
          );
        }}
      />
      {categoryAnalysis.length === 0 && (
        <Text style={{ textAlign: "center", marginTop: 20 }}>
          No categories found. Add from "Edit Budget".
        </Text>
      )}
      {/* EDIT BUDGET BUTTON */}
      <TouchableOpacity
        onPress={() => router.push("/edit-budget")}
        activeOpacity={0.8}
        style={styles.editButton}
      >
        <Feather name="edit-3" size={22} color="#fff" />
      </TouchableOpacity>
      {/* FLOATING BUTTON */}
      {/* <TouchableOpacity
        onPress={() => router.push("/chat")}
        style={styles.floatingButton}
      >
        <Text style={{ color: "#fff", fontSize: 18 }}>🤖</Text>
      </TouchableOpacity> */}
    </View>
  );
};

export default BudgetScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    paddingTop: 50,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
  },
  card: {
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    marginVertical: 6,
  },
  cardText: {
    fontSize: 16,
  },
  monthCard: {
    padding: 12,
    backgroundColor: "#e3f2fd",
    borderRadius: 10,
    marginRight: 10,
    marginTop: 10,
  },
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 50,
    elevation: 5,
  },
  setBudgetBtn: {
    backgroundColor: "#6C63FF",
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  summaryCard: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  monthText: {
    fontWeight: "bold",
    marginBottom: 10,
  },
  historyBtn: {
    marginTop: 15,
    padding: 12,
    backgroundColor: "#eee",
    borderRadius: 10,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  categoryCard: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 10,
    marginVertical: 6,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  catTitle: {
    fontWeight: "600",
  },
  editButton: {
    position: "absolute",
    bottom: 90,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#6c5ce7",
    justifyContent: "center",
    alignItems: "center",

    // Shadow (iOS)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,

    // Elevation (Android)
    elevation: 8,
  },
});
