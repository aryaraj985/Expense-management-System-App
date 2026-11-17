import { auth, db } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function BudgetHistory() {
  const [selected, setSelected] = useState<"month" | "year">("month");
  const [activeTab, setActiveTab] = useState("All");

  const tabs = [
    "All",
    "Overview",
    "Expense Summary",
    "Breakdown",
    "Projection",
    "Huge Transaction",
    "Top Spending",
  ];

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [expenses, setExpenses] = useState<any[]>([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const changeMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentMonth);

    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }

    setCurrentMonth(newDate);
  };
  const [uid, setUid] = useState<string | null>(null);
  const getMonthKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUid(user.uid);
      else setUid(null);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = onSnapshot(
      collection(db, "users", uid, "expenses"),

      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setExpenses(data);
      },
    );

    return () => unsubscribe();
  }, [uid]);
  useEffect(() => {
    if (!uid) return;

    const monthKey = getMonthKey(currentMonth); // ✅ get selected month

    const unsub = onSnapshot(
      doc(db, "users", uid, "budgets", monthKey), // ✅ dynamic
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setTotalBudget(Number(data.totalBudget) || 0);
        } else {
          // ✅ IMPORTANT (empty month)
          setTotalBudget(0);
        }
      },
    );

    return () => unsub();
  }, [uid, currentMonth]); // ✅ VERY IMPORTANT
  // ✅ FIXED: MOVED OUTSIDE
  const selectedMonth = currentMonth.getMonth();
  const selectedYear = currentMonth.getFullYear();

  const monthlyExpenses = expenses.filter((item) => {
    const d = new Date(item.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const totalSpent = monthlyExpenses.reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  );
  // 🔥 LAST MONTH CALCULATION
  const prevMonthDate = new Date(currentMonth);
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);

  const prevMonth = prevMonthDate.getMonth();
  const prevYear = prevMonthDate.getFullYear();

  const prevMonthExpenses = expenses.filter((item) => {
    const d = new Date(item.date);
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
  });

  const prevTotal = prevMonthExpenses.reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  );
  // 🔥 PERCENT CHANGE
  let percentChange = 0;

  if (prevTotal > 0) {
    percentChange = ((totalSpent - prevTotal) / prevTotal) * 100;
  }
  // 🔥 FORMAT DISPLAY
  const isIncrease = percentChange > 0;

  const changeText =
    prevTotal === 0
      ? "No previous data"
      : `${isIncrease ? "↗" : "↘"} ${Math.abs(percentChange).toFixed(
          1,
        )}% vs last month`;
  //   const [totalBudget, setTotalBudget] = useState(0);
  // keep budget static for now
  //   const totalBudget = 20000;

  const remaining = totalBudget - totalSpent;
  const yearlyExpenses = expenses.filter((item) => {
    const d = new Date(item.date);
    return d.getFullYear() === selectedYear;
  });

  const yearlyTotal = yearlyExpenses.reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  );
  const getDaysLeft = () => {
    const today = new Date();
    const selected = new Date(currentMonth);

    // If viewing current month → real days left
    if (
      today.getMonth() === selected.getMonth() &&
      today.getFullYear() === selected.getFullYear()
    ) {
      const lastDay = new Date(
        selected.getFullYear(),
        selected.getMonth() + 1,
        0,
      );
      return lastDay.getDate() - today.getDate();
    }

    // If past/future month → show full days
    const lastDay = new Date(
      selected.getFullYear(),
      selected.getMonth() + 1,
      0,
    );

    return lastDay.getDate();
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  };
  if (!uid) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={{ flex: 1, padding: 16, marginTop: 50 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>Budget History</Text>

      {/* TOGGLE */}
      <View
        style={{
          flexDirection: "row",
          marginTop: 20,
          backgroundColor: "#eee",
          borderRadius: 10,
          padding: 4,
        }}
      >
        <TouchableOpacity
          onPress={() => setSelected("month")}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 8,
            backgroundColor: selected === "month" ? "#6c5ce7" : "transparent",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: selected === "month" ? "#fff" : "#000",
              fontWeight: "600",
            }}
          >
            Month
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelected("year")}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 8,
            backgroundColor: selected === "year" ? "#6c5ce7" : "transparent",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: selected === "year" ? "#fff" : "#000",
              fontWeight: "600",
            }}
          >
            Year
          </Text>
        </TouchableOpacity>
      </View>

      {selected === "month" ? (
        <ScrollView
          style={{ marginTop: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={{ fontSize: 16, fontWeight: "600" }}>
            Monthly Overview
          </Text>
          {/* MONTH NAV */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 15,
            }}
          >
            <TouchableOpacity
              onPress={() => changeMonth("prev")}
              style={{ flex: 1 }}
            >
              <Text style={{ fontSize: 22 }}>◀</Text>
            </TouchableOpacity>

            <View
              style={{
                backgroundColor: "#6c5ce7",
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 20,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>
                {formatMonth(currentMonth)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => changeMonth("next")}
              style={{ flex: 1, alignItems: "flex-end" }}
            >
              <Text style={{ fontSize: 22 }}>▶</Text>
            </TouchableOpacity>
          </View>
          {/* TABS */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 20 }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab;

              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: "#6c5ce7",
                    marginRight: 10,
                    backgroundColor: isActive ? "#6c5ce7" : "#fff",
                  }}
                >
                  <Text
                    style={{
                      color: isActive ? "#fff" : "#6c5ce7",
                      fontWeight: "600",
                    }}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {/* 🔥 TAB CONTENT */}
          {(activeTab === "All" || activeTab === "Overview") && (
            <View style={{ marginTop: 20 }}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>💡 Overview</Text>

                <Text>Total Budget: ₹{totalBudget}</Text>
                <Text style={{ marginTop: 5 }}>
                  You have {getDaysLeft()} days left
                </Text>

                <View style={styles.innerCard}>
                  <Text>Budget Spend: ₹{totalSpent}</Text>
                  <Text>Unspent: ₹{remaining}</Text>
                </View>
              </View>
            </View>
          )}
          {(activeTab === "Expense Summary" || activeTab === "All") && (
            <View style={{ marginTop: 20 }}>
              <View style={styles.card}>
                {/* TITLE */}
                <Text style={styles.cardTitle}>💵 Expense Summary</Text>

                {/* TOTAL */}
                <Text style={styles.bigAmount}>₹{totalSpent}.00</Text>

                {/* CHANGE */}
                <Text style={styles.changeText}>{changeText}</Text>

                {/* DASH LINE */}
                <View style={styles.dashLine} />

                {/* SCALE */}
                <Text style={styles.scaleText}>₹0</Text>

                {/* PROGRESS BAR */}
                <View style={styles.barBackground}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${totalBudget ? (totalSpent / totalBudget) * 100 : 0}%`,
                      },
                    ]}
                  />
                </View>

                <Text style={styles.scaleText}>₹{totalSpent}</Text>

                {/* LEGEND */}
                <View style={styles.legendRow}>
                  <Text style={{ color: "green" }}>● Income</Text>
                  <Text style={{ color: "red", marginLeft: 15 }}>
                    ● Expense
                  </Text>
                </View>
              </View>
            </View>
          )}
          {(activeTab === "Breakdown" || activeTab === "All") && (
            <View style={{ marginTop: 20 }}>
              <View style={styles.card}>
                {/* TITLE */}
                <Text style={styles.cardTitle}>🟢 Breakdown Summary</Text>

                {/* SUBTEXT */}
                <Text style={styles.subText}>
                  Here's a summary of your budget breakdown so far.
                </Text>

                {/* CATEGORY LIST */}

                {Object.entries(
                  monthlyExpenses.reduce((acc: any, item) => {
                    const cat = item.category || "Other";
                    acc[cat] = (acc[cat] || 0) + Number(item.amount);
                    return acc;
                  }, {}),
                ).map(([cat, amt]: any) => (
                  <View key={cat}>
                    <View style={styles.rowItem}>
                      <View style={styles.leftRow}>
                        <View style={styles.dot} />
                        <Text>{cat}</Text>
                      </View>
                      <Text>
                        ₹{amt} / ₹{totalBudget}
                      </Text>
                    </View>
                    <View style={styles.divider} />
                  </View>
                ))}
              </View>
            </View>
          )}
          {(activeTab === "Projection" || activeTab === "All") && (
            <View style={{ marginTop: 20 }}>
              <View style={styles.card}>
                {/* TITLE */}
                <Text style={styles.cardTitle}>📊 Projection</Text>

                {/* SUBTEXT */}
                <Text style={styles.subText}>
                  Estimated result for the next months.
                </Text>

                {/* GRAPH AREA */}
                <View style={styles.graphContainer}>
                  <View
                    style={{ flexDirection: "row", alignItems: "flex-end" }}
                  >
                    {[...Array(12)].map((_, index) => {
                      const monthData = expenses.filter((item) => {
                        const d = new Date(item.date);
                        return (
                          d.getMonth() === index &&
                          d.getFullYear() === selectedYear
                        );
                      });

                      const total = monthData.reduce(
                        (sum, i) => sum + Number(i.amount),
                        0,
                      );

                      // scale height (max 120)
                      const height = Math.min((total / 10000) * 120, 120);

                      return (
                        <View
                          key={index}
                          style={{
                            alignItems: "center",
                            marginHorizontal: 3,
                          }}
                        >
                          <View
                            style={{
                              width: 10,
                              height: height || 5,
                              backgroundColor: "#a29bfe",
                              borderRadius: 5,
                            }}
                          />
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* MONTH LABELS */}
                <View style={styles.monthRow}>
                  {[
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sept",
                    "Oct",
                    "Nov",
                    "Dec",
                  ].map((m) => (
                    <Text key={m} style={styles.monthText}>
                      {m}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          )}
          {(activeTab === "Huge Transaction" || activeTab === "All") && (
            <View style={{ marginTop: 20 }}>
              <View style={styles.card}>
                {/* TITLE */}
                <Text style={styles.cardTitle}>💸 Huge Transactions</Text>

                <Text style={styles.subText}>
                  Your highest spending this month
                </Text>

                {/* TRANSACTION LIST */}

                {/* ITEM 1 */}
                {[...monthlyExpenses]
                  .sort((a, b) => Number(b.amount) - Number(a.amount))
                  .slice(0, 5)
                  .map((item) => (
                    <View key={item.id}>
                      <View style={styles.transactionItem}>
                        <View>
                          <Text style={styles.txTitle}>{item.title}</Text>
                          <Text style={styles.txSub}>
                            {item.category} • {item.date}
                          </Text>
                        </View>
                        <Text style={styles.txAmount}>₹{item.amount}</Text>
                      </View>
                      <View style={styles.divider} />
                    </View>
                  ))}
              </View>
            </View>
          )}
          {(activeTab === "Top Spending" || activeTab === "All") && (
            <View style={{ marginTop: 20 }}>
              <View style={styles.card}>
                {/* TITLE */}
                <Text style={styles.cardTitle}>🔺 Top spending categories</Text>

                {/* SUBTEXT */}
                <Text style={styles.subText}>
                  Here are your top spending category this month
                </Text>

                {/* DONUT */}
                <View style={styles.donutWrapper}>
                  <View style={styles.donutOuter}>
                    <View style={styles.donutInner}>
                      <Text style={styles.donutText}>₹{totalSpent}</Text>
                    </View>
                  </View>
                </View>

                {/* LEGEND */}
                <View style={styles.legendRow}>
                  {Object.entries(
                    monthlyExpenses.reduce((acc: any, item) => {
                      const cat = item.category || "Other";
                      acc[cat] = (acc[cat] || 0) + Number(item.amount);
                      return acc;
                    }, {}),
                  )
                    .sort((a: any, b: any) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([cat, amt]: any, index) => (
                      <View key={cat} style={styles.legendItem}>
                        <View
                          style={[
                            styles.dot,
                            {
                              backgroundColor: [
                                "#fab1a0",
                                "#ffeaa7",
                                "#81ecec",
                              ][index],
                            },
                          ]}
                        />
                        <Text>
                          {cat} (₹{amt})
                        </Text>
                      </View>
                    ))}
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: "600" }}>
            Yearly Overview
          </Text>

          <View
            style={{
              backgroundColor: "#f5f5f5",
              padding: 16,
              borderRadius: 12,
              marginTop: 10,
            }}
          >
            <Text>Total Spent This Year: ₹{yearlyTotal}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginTop: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  innerCard: {
    backgroundColor: "#f1efff",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  bigAmount: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 5,
  },

  changeText: {
    marginTop: 5,
    color: "#6c5ce7",
    fontWeight: "600",
  },

  dashLine: {
    borderBottomWidth: 1,
    borderStyle: "dashed",
    borderColor: "#ccc",
    marginVertical: 10,
  },

  barBackground: {
    height: 20,
    backgroundColor: "#eee",
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 10,
  },

  barFill: {
    height: "100%",
    backgroundColor: "#ff7675",
    borderRadius: 20,
  },

  scaleText: {
    marginTop: 5,
    color: "#555",
  },

  legendRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  subText: {
    color: "#777",
    marginBottom: 10,
  },

  rowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },

  leftRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#6c5ce7",
    marginRight: 10,
  },

  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 10,
  },
  graphContainer: {
    height: 150,
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 20,
  },

  graphBarWrapper: {
    width: "100%",
    alignItems: "center",
  },

  graphBar: {
    width: 40,
    height: 100,
    backgroundColor: "#a29bfe",
    borderRadius: 10,
  },

  monthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },

  monthText: {
    fontSize: 10,
    color: "#555",
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },

  txTitle: {
    fontSize: 15,
    fontWeight: "600",
  },

  txSub: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },

  txAmount: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#e74c3c",
  },
  donutWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  donutOuter: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#f8caca",
    alignItems: "center",
    justifyContent: "center",
  },

  donutInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  donutText: {
    fontWeight: "bold",
    fontSize: 16,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
});
