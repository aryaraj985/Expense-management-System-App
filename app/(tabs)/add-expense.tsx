import { auth, db } from "@/firebase";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Audio } from "expo-av";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    onSnapshot,
    setDoc,
    updateDoc,
} from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
// import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
const defaultCategories = [
  "Food",
  "Fuel",
  "Entertainment",
  "Commute",
  "Invest",
];
const testFirestore = async () => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await addDoc(collection(db, "users", uid, "categories"), {
    name: "Test Category",
  });

  console.log("✅ Firestore working");
};
export default function AddExpenseScreen() {
  const [uid, setUid] = useState<string | null>(null);
  console.log("🔥 AddExpenseScreen running");
  const playVoice = async (uri: string) => {
    try {
      if (!uri) {
        console.log("No URI");
        return;
      }

      console.log("🔊 Trying to play:", uri);

      const { sound } = await Audio.Sound.createAsync(
        { uri: uri.trim() }, // 🔥 IMPORTANT FIX
        { shouldPlay: true },
      );

      await sound.playAsync();
    } catch (err) {
      console.log("Play error:", err);
    }
  };

  const router = useRouter();

  const { expense, isEdit, voice } = useLocalSearchParams(); //   const [dbCategories, setDbCategories] = useState<string[]>([]);
  // 🔥 Parse incoming data
  const parsedExpense = expense ? JSON.parse(expense as string) : null;

  // 🔥 States (prefilled for edit)
  //   const [amount, setAmount] = useState(parsedExpense?.amount || "");
  //   const [title, setTitle] = useState(parsedExpense?.title || "");
  //   const [category, setCategory] = useState(parsedExpense?.category || "Food");
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Food");
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  //   const [customCategories, setCustomCategories] = useState<string[]>([]);
  //   const [search, setSearch] = useState("");
  //   const [showCreate, setShowCreate] = useState(false);
  //   const [newCategory, setNewCategory] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const allCategories = [
    ...new Set(
      [...defaultCategories, ...categories].filter(
        (c) => typeof c === "string" && c.trim() !== "",
      ),
    ),
  ];
  const filteredCategories = allCategories.filter(
    (cat) =>
      typeof cat === "string" &&
      cat.toLowerCase().includes(search.toLowerCase()),
  );
  const [date, setDate] = useState<Date | null>(
    parsedExpense?.date ? new Date(parsedExpense.date) : null,
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("✅ UID READY:", user.uid);
        setUid(user.uid);
      } else {
        console.log("❌ No user");
        setUid(null);
      }
    });

    return unsubscribe;
  }, []);
  useEffect(() => {
    if (!uid) return;

    const unsubscribe = onSnapshot(
      collection(db, "users", uid, "categories"),
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => doc.data().name)
          .filter((name) => typeof name === "string" && name.trim() !== "");
        setCategories(data);
      },
    );

    return () => unsubscribe();
  }, [uid]);
  useEffect(() => {
    if (isEdit === "true" && expense) {
      // ✏️ EDIT MODE ONLY
      const parsed = JSON.parse(expense as string);

      setAmount(parsed.amount || "");
      setTitle(parsed.title || "");
      setCategory(parsed.category || "Food");
      setDate(parsed.date ? new Date(parsed.date) : null);
    } else {
      // ➕ ALWAYS RESET FOR NEW
      setAmount("");
      setTitle("");
      setCategory("Food");
      setDate(null);
      setShowDropdown(false);
    }
  }, [expense, isEdit]);
  useEffect(() => {
    if (voice) {
      console.log("🎤 Voice received:", voice);

      // 🔥 AUTO-FILL (FAKE FOR NOW)
      setAmount("250");
      setTitle("Voice Expense");
      setCategory("Food");
    }
  }, [voice]);
  useEffect(() => {
    if (voice) {
      console.log("🎤 Voice received:", voice);

      // 🔥 AUTO-FILL FAKE DATA
      setAmount("250");
      setTitle("Voice Expense");
      setCategory("Food");

      // 🔥 VERY IMPORTANT (THIS WAS MISSING)
      setDate(new Date());
    }
  }, [voice]);
  useFocusEffect(
    useCallback(() => {
      // ✅ ONLY reset for ADD mode
      if (isEdit !== "true") {
        setTitle("");
        setAmount("");
        setCategory("Food");
        setDate(null);
      }
    }, [isEdit]),
  );
  //   // 🔥 Helper
  const getWeekKey = (date: string) => {
    const d = new Date(date);
    const oneJan = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(
      ((+d - +oneJan) / 86400000 + oneJan.getDay() + 1) / 7,
    );
    return `${d.getFullYear()}-W${week}`;
  };
  const isFormValid = amount && title && category && date;
  // 🔥 MAIN SAVE FUNCTION
  const handleSave = async () => {
    if (!uid) {
      alert("User not logged in");
      return;
    }
    if (!amount || !title) {
      alert("Please fill all fields");
      return;
    }

    if (!date) {
      alert("Please select date");
      return;
    }
    // 🔥 PREVENT FUTURE DATE
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);

    if (selected > today) {
      alert("Future date is not allowed");
      return;
    }

    const selectedDate = date.toISOString().split("T")[0];
    const expenseData = {
      amount: String(amount),
      title,
      category,
      date: selectedDate,
      voice: voice ? String(voice) : parsedExpense?.voice || null,
    };
    try {
      // ✏️ EDIT MODE
      if (isEdit === "true" && parsedExpense) {
        if (!uid) {
          console.log("❌ UID missing");
          return;
        }

        if (!parsedExpense?.id) {
          console.log("❌ Expense ID missing");
          return;
        }

        const ref = doc(db, "users", uid, "expenses", parsedExpense.id);

        await updateDoc(ref, {
          ...expenseData,
          createdAt: parsedExpense?.createdAt || Date.now(),
        });

        console.log("✅ Expense updated:", expenseData);
        console.log("✅ Saved successfully");

        const oldAmt = Number(parsedExpense.amount);
        const newAmt = Number(amount);
        const diff = newAmt - oldAmt;

        const date = selectedDate;

        // DAILY

        const dailyRef = doc(db, "users", uid, "dailyTotals", selectedDate);
        const dailySnap = await getDoc(dailyRef);

        if (dailySnap.exists()) {
          await updateDoc(dailyRef, {
            total: dailySnap.data().total + diff,
          });
        }

        // WEEKLY
        const weekKey = getWeekKey(date);
        const weekRef = doc(db, "users", uid, "weeklyTotals", weekKey);
        const weekSnap = await getDoc(weekRef);

        if (weekSnap.exists()) {
          await updateDoc(weekRef, {
            total: weekSnap.data().total + diff,
          });
        }

        // CATEGORY
        const catRef = doc(db, "users", uid, "categoryTotals", category);
        const catSnap = await getDoc(catRef);

        if (catSnap.exists()) {
          await updateDoc(catRef, {
            total: catSnap.data().total + diff,
          });
        }

        // alert("Updated successfully ✅");
      } else {
        // ➕ ADD NEW EXPENSE
        const docRef = await addDoc(collection(db, "users", uid, "expenses"), {
          ...expenseData,
          createdAt: Date.now(),
        });

        console.log("✅ Saved successfully");

        const amt = Number(amount);

        // DAILY
        const dailyRef = doc(db, "users", uid, "dailyTotals", selectedDate);
        const dailySnap = await getDoc(dailyRef);

        if (dailySnap.exists()) {
          await updateDoc(dailyRef, {
            total: dailySnap.data().total + amt,
          });
        } else {
          await setDoc(dailyRef, {
            date: selectedDate,
            total: amt,
          });
        }

        // WEEKLY
        const weekKey = getWeekKey(selectedDate);
        const weekRef = doc(db, "users", uid, "weeklyTotals", weekKey);
        const weekSnap = await getDoc(weekRef);

        if (weekSnap.exists()) {
          await updateDoc(weekRef, {
            total: weekSnap.data().total + amt,
          });
        } else {
          await setDoc(weekRef, {
            weekKey,
            total: amt,
          });
        }

        // CATEGORY
        const catRef = doc(db, "users", uid, "categoryTotals", category);
        const catSnap = await getDoc(catRef);

        if (catSnap.exists()) {
          await updateDoc(catRef, {
            total: catSnap.data().total + amt,
          });
        } else {
          await setDoc(catRef, {
            category,
            total: amt,
          });
        }

        // alert("Expense added ✅");
      }
      // 🔥 RESET FORM
      setTitle("");
      setAmount("");
      setCategory("");
      setDate(null);
      router.back();
    } catch (error) {
      console.log("Save Error:", error);
    }
  };

  if (!uid) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fff",
        }}
      >
        <Text style={{ color: "#111827" }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        padding: 20,
        paddingTop: 50,
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
        {isEdit === "true" ? "Edit Expense" : "Add Expense"}
      </Text>
      {/* TITLE */}
      <Text style={{ marginBottom: 5, fontSize: 14, color: "#111827" }}>
        Title
      </Text>
      <TextInput
        placeholder="What did you spend on?"
        placeholderTextColor="#6b7280"
        value={title}
        onChangeText={setTitle}
        style={{
          borderWidth: 1,
          borderColor: "#9ca3af",
          padding: 12,
          marginBottom: 15,
          borderRadius: 10,
          backgroundColor: "#fff",
          color: "#111827",
        }}
      />
      {/* AMOUNT */}
      {/* AMOUNT */}
      <Text style={{ marginBottom: 5, fontSize: 14, color: "#111827" }}>
        Amount
      </Text>
      <TextInput
        placeholder="Enter amount"
        placeholderTextColor="#6b7280"
        value={amount}
        onChangeText={(text) => {
          const cleaned = text.replace(/[^0-9]/g, "");
          setAmount(cleaned);
        }}
        keyboardType="numeric"
        style={{
          borderWidth: 1,
          borderColor: "#9ca3af",
          padding: 12,
          marginBottom: 15,
          borderRadius: 10,
          backgroundColor: "#fff",
          color: "#111827",
        }}
      />
      {/* CATEGORY DROPDOWN */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ marginBottom: 10, color: "#111827" }}>
          Select Category
        </Text>

        {/* Input Box */}
        <TouchableOpacity
          onPress={() => setShowDropdown(!showDropdown)} // ✅ FIXED
          style={{
            borderWidth: 1,
            borderColor: "#9ca3af",
            padding: 12,
            borderRadius: 10,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#fff",
          }}
        >
          <Text style={{ fontSize: 16, color: "#111827" }}>
            {category || "Select Category"}
          </Text>

          <Feather name="chevron-down" size={20} color="#555" />
        </TouchableOpacity>

        {/* Dropdown List */}
        {showDropdown && (
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 10,
              padding: 10,
              marginTop: 10,
              elevation: 5,
            }}
          >
            {/* 🔍 SEARCH INPUT */}
            <TextInput
              placeholder="Search or add category"
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#6b7280"
              style={{
                borderWidth: 1,
                borderColor: "#9ca3af",
                borderRadius: 8,
                padding: 10,
                marginBottom: 10,
                backgroundColor: "#fff",
                color: "#111827",
              }}
            />

            {/* 📂 CATEGORY LIST */}
            {filteredCategories.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => {
                  setCategory(cat);
                  setShowDropdown(false);
                  setSearch("");
                }}
                style={{ padding: 10 }}
              >
                <Text>{cat}</Text>
              </TouchableOpacity>
            ))}

            {/* ➕ ADD NEW CATEGORY IF NOT FOUND */}
            {search.trim() !== "" &&
              !allCategories.some(
                (cat) =>
                  typeof cat === "string" &&
                  cat.toLowerCase() === search.toLowerCase(),
              ) && (
                <TouchableOpacity
                  onPress={async () => {
                    if (!uid) return;

                    await addDoc(collection(db, "users", uid, "categories"), {
                      name: search,
                    });
                    setCategory(search);
                    setShowDropdown(false);
                    setSearch("");
                  }}
                  style={{
                    padding: 10,
                    borderTopWidth: 1,
                    marginTop: 5,
                  }}
                >
                  <Text style={{ color: "#6c5ce7" }}>➕ Add "{search}"</Text>
                </TouchableOpacity>
              )}
          </View>
        )}
        {/* ➕ CREATE CATEGORY */}
        {/* <TouchableOpacity
          onPress={() => setShowCreate(!showCreate)}
          style={{
            marginBottom: 15,
          }}
        >
          <Text style={{ color: "#6c5ce7", fontWeight: "bold" }}>
            + Create Category
          </Text>
        </TouchableOpacity>
        {showCreate && (
          <View style={{ marginBottom: 20 }}>
            <TextInput
              placeholder="Enter new category"
              value={newCategory}
              onChangeText={setNewCategory}
              style={{
                borderWidth: 1,
                padding: 12,
                borderRadius: 10,
                marginBottom: 10,
              }}
            />

            <TouchableOpacity
              onPress={() => {
                if (!newCategory.trim()) return;

                setCustomCategories((prev) => [...prev, newCategory]);

                // ✅ select it immediately
                setCategory(newCategory);

                // reset
                setNewCategory("");
                setShowCreate(false);
              }}
              style={{
                backgroundColor: "#6c5ce7",
                padding: 12,
                borderRadius: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white" }}>Add Category</Text>
            </TouchableOpacity>
          </View>
        )} */}
      </View>
      {/* CATEGORY */}
      {/* <View style={{ marginBottom: 20 }}>
        <Text style={{ marginBottom: 10 }}>Select Category</Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {defaultCategories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              style={{
                backgroundColor: category === cat ? "#6c5ce7" : "#eee",
                padding: 10,
                borderRadius: 8,
                margin: 5,
              }}
            >
              <Text
                style={{
                  color: category === cat ? "white" : "black",
                }}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View> */}
      {/* DATE PICKER */}
      <Text style={{ marginBottom: 5, fontSize: 14, color: "#111827" }}>
        Date
      </Text>
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        style={{
          padding: 12,
          borderWidth: 1,
          borderColor: "#9ca3af",
          borderRadius: 10,
          marginBottom: 20,
          backgroundColor: "#fff",
        }}
      >
        <Text style={{ color: "#111827" }}>
          {date ? date.toLocaleDateString() : "Select Date"}
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={date || new Date()}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}
      {voice && (
        <TouchableOpacity
          onPress={() => playVoice(String(voice))}
          style={{
            backgroundColor: "#2ecc71",
            padding: 12,
            borderRadius: 10,
            alignItems: "center",
            marginBottom: 15,
          }}
        >
          <Text style={{ color: "white" }}>▶️ Play Recording</Text>
        </TouchableOpacity>
      )}
      {/* SAVE BUTTON */}
      <TouchableOpacity
        onPress={handleSave}
        disabled={!isFormValid}
        style={{
          backgroundColor: isFormValid ? "#6c5ce7" : "#ccc",
          padding: 15,
          borderRadius: 10,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontSize: 16 }}>Save</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.back()}
        style={{
          backgroundColor: "#ccc",
          padding: 15,
          borderRadius: 10,
          alignItems: "center",
          marginTop: 10,
        }}
      >
        <Text style={{ color: "black", fontSize: 16 }}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}
