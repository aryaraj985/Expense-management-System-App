import { auth, db } from "@/firebase";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// export default function EditBudget() {
export default function EditBudget() {
  const router = useRouter();

  const [selectedMonth, setSelectedMonth] = useState("April 2026");
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

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
  const getMonthKey = (month: string) => {
    const [name, year] = month.split(" ");

    const monthList = [
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

    const index = monthList.indexOf(name);

    return `${year}-${String(index + 1).padStart(2, "0")}`;
  };
  const [uid, setUid] = useState<string | null>(null);
  //   const router = useRouter();

  const [totalBudget, setTotalBudget] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [allCategoryOptions, setAllCategoryOptions] = useState<string[]>([]);
  const [newAmount, setNewAmount] = useState("");
  const filteredCategoryOptions = allCategoryOptions.filter((cat) =>
    cat.toLowerCase().includes(newCategory.toLowerCase()),
  );
  const isExactMatch = allCategoryOptions.some(
    (cat) => cat.toLowerCase() === newCategory.toLowerCase(),
  );
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
      } else {
        setUid(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // 💡 SMART SUGGESTIONS
  const suggestions = [
    "Food",
    "Travel",
    "Rent",
    "Shopping",
    "EMI",
    "Savings",
    "Fuel",
    "Entertainment",
    "Club",
    "Office",
  ];
  const filteredSuggestions = suggestions.filter((item) => {
    return !categories.some(
      (c) => c.name.trim().toLowerCase() === item.trim().toLowerCase(),
    );
  });

  // 🔥 FETCH DATA
  useEffect(() => {
    if (!uid) return;

    const fetchData = async () => {
      // 🔥 STEP 1: get expenses of selected month
      const expSnap = await getDocs(collection(db, "users", uid, "expenses"));

      const monthKey = getMonthKey(selectedMonth);

      const filteredExpenses = expSnap.docs
        .map((doc) => doc.data())
        .filter((exp: any) => exp?.date?.startsWith(monthKey));

      const expenseCategories = [
        ...new Set(filteredExpenses.map((e: any) => e?.category)),
      ].filter(Boolean);
      setAllCategoryOptions(expenseCategories);

      // 🔥 STEP 2: get budget data
      const budgetSnap = await getDoc(
        doc(db, "users", uid, "budgets", getMonthKey(selectedMonth)),
      );

      let budgetCategories: any[] = [];

      if (budgetSnap.exists()) {
        const data = budgetSnap.data();

        setTotalBudget(String(data.totalBudget || ""));
        budgetCategories = data.categories || [];
      } else {
        setTotalBudget("");
      }

      // 🔥 STEP 3: merge categories
      const merged = expenseCategories.map((cat) => {
        const found = budgetCategories.find(
          (c: any) => c.name.toLowerCase() === cat.toLowerCase(),
        );

        // 🔥 get spent amount for this category
        const spent = filteredExpenses
          .filter((e: any) => e.category === cat)
          .reduce((sum: number, e: any) => sum + Number(e.amount), 0);

        return {
          name: cat,
          // ✅ priority: budget → else spent → else 0
          budget: found
            ? String(found.budget)
            : spent > 0
              ? String(spent)
              : "0",
        };
      });

      setCategories(merged);
    };

    fetchData();
  }, [uid, selectedMonth]);

  // 🔥 ADD THIS EXACTLY HERE
  useEffect(() => {
    const sum = categories.reduce((acc, curr) => {
      return acc + Number(curr.budget || 0);
    }, 0);

    setTotalBudget(String(sum));
  }, [categories]);
  if (!uid) {
    return <Text>Loading...</Text>;
  }

  // 🔥 UPDATE CATEGORY
  const updateCategory = (index: number, value: string) => {
    const updated = [...categories];
    updated[index].budget = value;
    setCategories(updated);
  };

  // 🔥 DELETE CATEGORY
  const deleteCategory = (index: number) => {
    const updated = categories.filter((_, i) => i !== index);
    setCategories(updated);
  };

  // 🔥 ADD NEW CATEGORY
  const addCategory = () => {
    if (!newCategory.trim()) {
      alert("Enter category name");
      return;
    }

    if (!newAmount || Number(newAmount) <= 0) {
      alert("Enter valid amount");
      return;
    }
    const cleanName = newCategory.trim();

    const exists = categories.some(
      (c) => c.name.trim().toLowerCase() === cleanName.toLowerCase(),
    );

    if (exists) return;

    setCategories([...categories, { name: cleanName, budget: newAmount }]);
    // 🔥 ADD TO OPTIONS LIST ALSO
    setAllCategoryOptions((prev) => {
      if (!prev.includes(cleanName)) {
        return [...prev, cleanName];
      }
      return prev;
    });

    setNewCategory("");
    setNewAmount("");
    setShowCategoryDropdown(false);
  };

  // 🔥 ADD FROM SUGGESTION
  const addSuggestion = (name: string) => {
    const exists = categories.some(
      (c) => c.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );

    if (!exists) {
      setCategories([...categories, { name, budget: "0" }]);
    }
  };

  // 🔥 SAVE
  const saveBudget = async () => {
    const finalCategories = categories.map((c) => ({
      name: c.name,
      budget: Number(c.budget),
    }));

    const newTotal = categories.reduce((acc, curr) => {
      return acc + Number(curr.budget || 0);
    }, 0);

    try {
      await setDoc(
        doc(db, "users", uid, "budgets", getMonthKey(selectedMonth)),
        {
          categories: finalCategories,
          totalBudget: newTotal,
          createdAt: new Date(),
        },
      );

      alert("Budget saved successfully ✅");
      router.replace("/(tabs)/BudgetScreen");
    } catch (error) {
      console.log("Save Error:", error);
      alert("Something went wrong ❌");
    }
  };
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 120 }} // 🔥 IMPORTANT
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Set Category-wise Limits</Text>
        {/* MONTH SELECTOR */}
        <Text style={styles.label}>Select Month</Text>

        <TouchableOpacity
          onPress={() => setShowMonthDropdown(!showMonthDropdown)}
          style={[styles.input, { justifyContent: "center" }]}
        >
          <Text>{selectedMonth} ▼</Text>
        </TouchableOpacity>

        {showMonthDropdown && (
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 10,
              marginTop: 5,
              elevation: 5,
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
        {/* TOTAL BUDGET */}
        <Text style={styles.label}>Total Budget</Text>
        <TextInput
          value={totalBudget}
          editable={false} // 🔥 IMPORTANT
          style={[styles.input, { backgroundColor: "#eee" }]}
        />
        {/* CATEGORY LIST */}
        <Text style={styles.label}>Categories</Text>
        {categories.map((item, index) => (
          <View key={index} style={styles.categoryRow}>
            <Text style={styles.categoryName}>{item.name}</Text>

            <TextInput
              value={item.budget}
              onChangeText={(val) => updateCategory(index, val)}
              keyboardType="numeric"
              style={styles.categoryInput}
            />

            {/* DELETE BUTTON */}
            <TouchableOpacity onPress={() => deleteCategory(index)}>
              <Text style={{ color: "red", marginLeft: 10 }}>❌</Text>
            </TouchableOpacity>
          </View>
        ))}
        {/* ADD NEW CATEGORY */}
        <Text style={styles.label}>Category</Text>
        <View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {/* CATEGORY INPUT */}
            <View style={{ flex: 1 }}>
              <TextInput
                placeholder="Search or add category"
                value={newCategory}
                onChangeText={(text) => {
                  setNewCategory(text);
                  setShowCategoryDropdown(true);
                }}
                style={styles.input}
              />

              {/* DROPDOWN */}
              {showCategoryDropdown && newCategory.length > 0 && (
                <View
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 10,
                    marginTop: 5,
                    elevation: 5,
                    maxHeight: 150,
                    position: "absolute",
                    top: 50,
                    width: "100%",
                    zIndex: 10,
                  }}
                >
                  {/* 🔍 EXISTING MATCHES */}
                  {filteredCategoryOptions.map((item) => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => {
                        setNewCategory(item);
                        setShowCategoryDropdown(false);
                      }}
                      style={{
                        padding: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: "#eee",
                      }}
                    >
                      <Text>{item}</Text>
                    </TouchableOpacity>
                  ))}

                  {/* ➕ ADD NEW CATEGORY */}
                  {!isExactMatch && newCategory.trim().length > 0 && (
                    <TouchableOpacity
                      onPress={async () => {
                        if (!uid) return;

                        const cleanName = newCategory.trim();

                        if (!cleanName) return;

                        // 🔥 SAVE TO FIRESTORE (same as AddExpense)
                        await addDoc(
                          collection(db, "users", uid, "categories"),
                          {
                            name: cleanName,
                          },
                        );

                        // 🔥 UPDATE LOCAL LIST
                        setAllCategoryOptions((prev) => {
                          if (!prev.includes(cleanName)) {
                            return [...prev, cleanName];
                          }
                          return prev;
                        });

                        // 🔥 SET INPUT VALUE
                        setNewCategory(cleanName);

                        // 🔥 CLOSE DROPDOWN
                        setShowCategoryDropdown(false);
                      }}
                      style={{
                        padding: 10,
                        backgroundColor: "#f1f1f1",
                      }}
                    >
                      <Text style={{ color: "#6c5ce7", fontWeight: "bold" }}>
                        ➕ Add "{newCategory}"
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* AMOUNT INPUT */}
            <View style={{ flex: 1 }}>
              <TextInput
                placeholder="Amount"
                value={newAmount}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, "");
                  setNewAmount(cleaned);
                }}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
          </View>
        </View>
        {/* <TextInput
          placeholder="Amount"
          value={newAmount}
          onChangeText={setNewAmount}
          keyboardType="numeric"
          style={styles.input}
        /> */}
        <TouchableOpacity style={styles.addBtn} onPress={addCategory}>
          <Text style={{ color: "#fff" }}>+ Add Category</Text>
        </TouchableOpacity>
        {/* 💡 SUGGESTIONS */}
        <Text style={styles.label}>Suggestions</Text>
        <View style={styles.suggestionContainer}>
          {filteredSuggestions.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => addSuggestion(item)}
              style={styles.suggestionChip}
            >
              <Text>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* SAVE */}
        <View style={{ marginBottom: 40 }}>
          <TouchableOpacity
            style={[
              styles.saveBtn,
              categories.length === 0 && { backgroundColor: "#ccc" },
            ]}
            onPress={saveBudget}
            disabled={categories.length === 0}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>
              Save Changes
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 50,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  label: {
    marginTop: 15,
    marginBottom: 5,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
  },
  categoryInput: {
    borderWidth: 1,
    padding: 8,
    borderRadius: 8,
    width: 80,
    textAlign: "center",
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
    marginTop: 30,
    alignItems: "center",
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
});
