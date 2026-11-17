import { auth, db } from "@/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart } from "react-native-chart-kit";
import Svg, { Circle, G } from "react-native-svg";

/* ---------------- DONUT CHART ---------------- */
const DonutChart = ({
  data,
  total,
  selectedCategory,
  setSelectedCategory,
}: any) => {
  const radius = 80;
  const strokeWidth = 25;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ justifyContent: "center", alignItems: "center" }}>
        <Svg width={200} height={200}>
          <G rotation={-90} origin="100,100">
            {data.map((item: any, index: number) => {
              const percent = total > 0 ? item.amount / total : 0;
              const strokeDashoffset =
                circumference * (1 - cumulativePercent - percent);

              cumulativePercent += percent;

              return (
                <Circle
                  key={index}
                  cx="100"
                  cy="100"
                  r={radius}
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  fill="none"
                />
              );
            })}
          </G>
        </Svg>

        <View style={{ position: "absolute", alignItems: "center" }}>
          <Text style={{ color: "#555" }}>Total</Text>
          <Text style={{ fontSize: 20, fontWeight: "bold", color: "#000" }}>
            ₹ {total}
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 20, width: "100%" }}>
        {data.map((item: any, index: number) => {
          const percent = ((item.amount / total) * 100).toFixed(1);

          return (
            <TouchableOpacity
              key={index}
              onPress={() =>
                setSelectedCategory(
                  selectedCategory === item.name ? null : item.name,
                )
              }
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginVertical: 5,
                padding: 8,
                borderRadius: 10,
                backgroundColor:
                  selectedCategory === item.name ? "#eaeaf0" : "transparent",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: item.color,
                    marginRight: 8,
                  }}
                />
                <Text style={{ color: "#000" }}>{item.name}</Text>
              </View>

              <Text style={{ color: "#000", fontWeight: "bold" }}>
                ₹ {item.amount} ({percent}%)
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

/* ---------------- TYPES ---------------- */
type Expense = {
  amount: string;
  date: string;
  category?: string;
};

// const convertToDate = (rawDate) => {
//   const [day, month, year] = rawDate.split("/");
//   return new Date(year, month - 1, day);
// };
// const convertToDate = (rawDate: string) => {
//   // ✅ If ISO format (Firebase / fallback)
//   if (rawDate.includes("-")) {
//     return new Date(rawDate);
//   }

//   // ✅ If dd/mm/yyyy format
//   const [day, month, year] = rawDate.split("/");
//   return new Date(year, month - 1, day);
// };
const convertToDate = (rawDate: string) => {
  // ✅ ISO format fix (REMOVE TIMEZONE SHIFT)
  if (rawDate.includes("T")) {
    const onlyDate = rawDate.split("T")[0]; // "2026-03-25"
    return new Date(onlyDate);
  }

  // ✅ ISO without time
  if (rawDate.includes("-")) {
    return new Date(rawDate);
  }

  // ✅ dd/mm/yyyy
  const [day, month, year] = rawDate.split("/");
  return new Date(Number(year), Number(month) - 1, Number(day));
};
export default function AnalysisScreen() {
  // const { expenses } = useLocalSearchParams();
  // console.log("Expenses: ", expenses);
  const [mode, setMode] = useState<"day" | "week">("day");
  const [parsedExpenses, setParsedExpenses] = useState<Expense[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dailyData, setDailyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  // useEffect(() => {
  //   const fetchDaily = async () => {
  //     const snapshot = await getDocs(collection(db, "dailyTotals"));

  //     const data = snapshot.docs.map((doc) => doc.data());
  //     setDailyData(data);
  //   };

  //   fetchDaily();
  // }, []);
  // useEffect(() => {
  //   const fetchWeekly = async () => {
  //     const snapshot = await getDocs(collection(db, "weeklyTotals"));

  //     const data = snapshot.docs.map((doc) => doc.data());
  //     setWeeklyData(data);
  //   };

  //   fetchWeekly();
  // }, []);
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users", uid, "expenses"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          ...doc.data(),
        })) as Expense[];

        console.log("🔥 LIVE EXPENSES:", data);

        setParsedExpenses(data);
      },
    );

    return () => unsubscribe();
  }, []);
  // let parsedExpenses: Expense[] = [];

  // try {
  //   parsedExpenses =
  //     expenses && typeof expenses === "string" ? JSON.parse(expenses) : [];
  //   console.log("Parsed expenses: ", parsedExpenses);
  // } catch (e) {
  //   console.log("Parse error:", e);
  //   parsedExpenses = [];
  // }

  // // fallback
  // if (!parsedExpenses || parsedExpenses.length === 0) {
  //   parsedExpenses = [
  //     { amount: "200", date: new Date().toISOString(), category: "Food" },
  //     { amount: "500", date: new Date().toISOString(), category: "Travel" },
  //   ];
  // }
  // const parsedExpenses: Expense[] = [
  //   { amount: "2000", date: "2026-03-24", category: "Food" },
  //   { amount: "3000", date: "2026-03-25", category: "Travel" },
  //   { amount: "1500", date: "2026-03-26", category: "Food" },
  //   { amount: "4000", date: "2026-03-27", category: "Shopping" },
  //   { amount: "2500", date: "2026-03-28", category: "Travel" },
  //   { amount: "1900", date: "2026-03-29", category: "Food" },
  //   { amount: "3500", date: "2026-03-30", category: "Travel" },
  // ];
  const filteredExpenses = parsedExpenses.filter((item) => {
    const d = convertToDate(item.date);

    const matchMonth = d.getMonth() === selectedMonth;

    const matchCategory = selectedCategory
      ? item.category === selectedCategory
      : true;

    return matchMonth && matchCategory;
  });
  const now = new Date();

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const dayWise: Record<string, number> = {
    Sun: 0,
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
  };

  // ✅ FIXED DAY LOGIC
  filteredExpenses.forEach((item) => {
    console.log("date passed", item.date);
    // const d = new Date(item.date);
    const d = convertToDate(item.date);
    console.log("date convert", d);
    const dayIndex = d.getDay();
    const label = dayLabels[dayIndex];

    if (dayWise[label] !== undefined) {
      dayWise[label] += Number(item.amount);
    }
  });
  console.log("daywise:", dayWise);

  const weekLabels = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];

  const weekWise: Record<string, number> = {
    "Week 1": 0,
    "Week 2": 0,
    "Week 3": 0,
    "Week 4": 0,
    "Week 5": 0,
  };

  // filteredExpenses.forEach((item) => {
  //   const d = new Date(item.date);
  //   console.log(item.amount);
  //   if (
  //     d.getMonth() === now.getMonth() &&
  //     d.getFullYear() === now.getFullYear()
  //   ) {
  //     const week = Math.ceil(d.getDate() / 7);
  //     const key = `Week ${week}`;

  //     if (weekWise[key] !== undefined) {
  //       weekWise[key] += Number(item.amount);
  //     }
  //   }
  // });
  // ✅ WEEK-WISE CALCULATION (FINAL FIX)

  filteredExpenses.forEach((item) => {
    const d = convertToDate(item.date);

    // ❗ OPTIONAL: remove filter if you want all data
    // if (
    //   d.getMonth() === now.getMonth() &&
    //   d.getFullYear() === now.getFullYear()
    // ) {

    const dayOfMonth = d.getDate();

    let week = 1;

    if (dayOfMonth <= 7) week = 1;
    else if (dayOfMonth <= 14) week = 2;
    else if (dayOfMonth <= 21) week = 3;
    else if (dayOfMonth <= 28) week = 4;
    else week = 5;

    const key = `Week ${week}`;

    if (weekWise[key] !== undefined) {
      weekWise[key] += Number(item.amount);
    }

    // }
  });
  // let labels: string[] = [];
  // let dataValues: number[] = [];

  // if (mode === "day") {
  //   labels = dayLabels;
  //   dataValues = dayLabels.map((l) => dayWise[l] || 0);
  // } else {
  //   labels = weekLabels;
  //   dataValues = weekLabels.map((l) => weekWise[l] || 0);
  // }
  let labels: string[] = [];
  let dataValues: number[] = [];

  if (mode === "day") {
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const dayWise: Record<string, number> = {
      Sun: 0,
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
    };

    parsedExpenses.forEach((item) => {
      const d = convertToDate(item.date);

      // 🔥 MONTH FILTER (VERY IMPORTANT)
      if (d.getMonth() !== selectedMonth) return;

      // 🔥 CATEGORY FILTER
      if (selectedCategory && item.category !== selectedCategory) return;

      const day = dayLabels[d.getDay()];
      dayWise[day] += Number(item.amount);
    });

    labels = dayLabels;
    dataValues = dayLabels.map((day) => dayWise[day]);
  }

  if (mode === "week") {
    const weekLabels = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];

    const weekWise: Record<string, number> = {
      "Week 1": 0,
      "Week 2": 0,
      "Week 3": 0,
      "Week 4": 0,
      "Week 5": 0,
    };

    parsedExpenses.forEach((item) => {
      const d = convertToDate(item.date);

      // 🔥 MONTH FILTER
      if (d.getMonth() !== selectedMonth) return;

      // 🔥 CATEGORY FILTER
      if (selectedCategory && item.category !== selectedCategory) return;

      const day = d.getDate();

      let week = 1;
      if (day <= 7) week = 1;
      else if (day <= 14) week = 2;
      else if (day <= 21) week = 3;
      else if (day <= 28) week = 4;
      else week = 5;

      const key = `Week ${week}`;
      weekWise[key] += Number(item.amount);
    });

    labels = weekLabels;
    dataValues = weekLabels.map((w) => weekWise[w]);
  }
  console.log("data values: ", dataValues);
  const totalSpent = filteredExpenses.reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  );

  const categoryData: Record<string, number> = {};

  filteredExpenses.forEach((item) => {
    const cat = item.category || "Other";
    categoryData[cat] = (categoryData[cat] || 0) + Number(item.amount);
  });

  const pieChartData = Object.keys(categoryData).map((key, index) => ({
    name: key,
    amount: Number(categoryData[key]) || 0,
    color: ["#6c5ce7", "#00b894", "#fdcb6e", "#e17055", "#0984e3"][index % 5],
  }));

  const screenWidth = Dimensions.get("window").width;

  // ✅ SAFE DATA (FIX ERROR)
  const safeLabels = labels.length > 0 ? labels : ["No Data"];
  const safeData =
    dataValues.length > 0
      ? dataValues.map((v) => (isNaN(v) ? 0 : Number(v)))
      : [0];

  const hasData = safeData.some((v) => v > 0);
  const currentYear = new Date().getFullYear();

  const months = [
    `Jan ${currentYear}`,
    `Feb ${currentYear}`,
    `Mar ${currentYear}`,
    `Apr ${currentYear}`,
    `May ${currentYear}`,
    `Jun ${currentYear}`,

    `Jul ${currentYear}`,
    `Aug ${currentYear}`,
    `Sep ${currentYear}`,
    `Oct ${currentYear}`,
    `Nov ${currentYear}`,
    `Dec ${currentYear}`,
  ];
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#ffffff" }}
      contentContainerStyle={{
        flexGrow: 1,
        padding: 20,
        paddingTop: 50,
        backgroundColor: "#ffffff",
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
        Analysis 📊
      </Text>
      {/* TOGGLE */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          marginBottom: 20,
        }}
      >
        {/* DAY */}
        <TouchableOpacity onPress={() => setMode("day")}>
          <Text
            style={{
              backgroundColor: mode === "day" ? "#6c5ce7" : "#eee",
              color: mode === "day" ? "#fff" : "#333",
              padding: 8,
              borderRadius: 8,
            }}
          >
            Day
          </Text>
        </TouchableOpacity>

        {/* WEEK */}
        <TouchableOpacity onPress={() => setMode("week")}>
          <Text
            style={{
              backgroundColor: mode === "week" ? "#6c5ce7" : "#eee",
              color: mode === "week" ? "#fff" : "#333",
              padding: 8,
              borderRadius: 8,
            }}
          >
            Week
          </Text>
        </TouchableOpacity>

        {/* MONTH DROPDOWN */}
        <View>
          <TouchableOpacity
            onPress={() => setShowDropdown(!showDropdown)}
            style={{
              backgroundColor: "#eee",
              padding: 8,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#111827" }}>
              {months[selectedMonth]} ▼
            </Text>
          </TouchableOpacity>

          {showDropdown && (
            <View
              style={{
                position: "absolute",
                top: 40,
                backgroundColor: "#fff",
                borderRadius: 8,
                elevation: 5,
                padding: 5,
                zIndex: 10,
              }}
            >
              {months.map((m, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => {
                    setSelectedMonth(i);
                    setShowDropdown(false);
                  }}
                  style={{ padding: 8 }}
                >
                  <Text style={{ color: "#111827" }}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
      {/* DONUT */}
      <DonutChart
        data={pieChartData}
        total={totalSpent}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {/* SUMMARY */}
      <View
        style={{
          backgroundColor: "#1e1e2f",
          padding: 15,
          borderRadius: 15,
          marginVertical: 20,
        }}
      >
        <Text style={{ color: "#fff" }}>₹ {totalSpent}</Text>
      </View>

      {/* BAR CHART */}
      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 18, marginBottom: 15, color: "#111827" }}>
          Spending Trend 📊
        </Text>

        <BarChart
          data={{
            labels: safeLabels,
            datasets: [
              {
                data: hasData ? safeData : safeLabels.map(() => 0),
              },
            ],
          }}
          width={screenWidth - 20}
          height={260}
          yAxisLabel="₹"
          yAxisSuffix=""
          fromZero
          showValuesOnTopOfBars
          withInnerLines={false}
          chartConfig={{
            backgroundColor: "#ffffff",
            backgroundGradientFrom: "#ffffff",
            backgroundGradientTo: "#ffffff",
            decimalPlaces: 0,
            barPercentage: 0.5,
            color: (opacity = 1) => `rgba(108,92,231,${opacity})`,
            labelColor: () => "#333",
            propsForLabels: {
              fontSize: 10,
            },
          }}
        />

        {!hasData && (
          <Text style={{ textAlign: "center", marginTop: 10, color: "#999" }}>
            No expense data available
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
