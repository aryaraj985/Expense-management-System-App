// import { auth } from "@/firebase";

console.log("AUTH USER:", auth.currentUser);
console.log("AUTH UID:", auth.currentUser?.uid);
import { auth, db } from "@/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Feather, MaterialIcons } from "@expo/vector-icons";
// import Animated, {
//   useAnimatedStyle,
//   useSharedValue,
//   withRepeat,
//   withTiming,
// } from "react-native-reanimated";
// import { useNavigation } from "@react-navigation/native";
import { getDoc, setDoc } from "firebase/firestore";
// import { useLayoutEffect } from "react";
import { Alert, Text } from "react-native";
// import { Button, Card, Text } from "react-native-paper";
// import { NativeStackNavigationProp } from "@react-navigation/native-stack";
// import { Audio } from "expo-av";
// import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";

// import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
// import { RootStackParamList } from "./types";
export default function HomeScreen() {
  console.log("USER:", auth.currentUser);
  console.log("UID:", auth.currentUser?.uid);
  // const [expenses, setExpenses] = useState<any[]>([]);
  // const [recordingURI, setRecordingURI] = useState<string | null>(null);
  // const recordingRef = useRef<Audio.Recording | null>(null);
  // // type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Home">;
  const getWeekKey = (date: string) => {
    const d = new Date(date);
    const oneJan = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(
      ((+d - +oneJan) / 86400000 + oneJan.getDay() + 1) / 7,
    );
    return `${d.getFullYear()}-W${week}`;
  };

  const updateAggregates = async (expense: any) => {
    const amt = Number(expense.amount);
    const date = expense.date;
    console.log("expense date: ", date);
    const category = expense.category;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    // ---------------- DAILY ----------------
    const dailyRef = doc(db, "users", uid, "dailyTotals", date);
    const dailySnap = await getDoc(dailyRef);

    if (dailySnap.exists()) {
      await updateDoc(dailyRef, {
        total: dailySnap.data().total + amt,
      });
    } else {
      await setDoc(dailyRef, {
        date,
        total: amt,
      });
    }

    // ---------------- WEEKLY ----------------
    const weekKey = getWeekKey(date);
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

    // ---------------- CATEGORY ----------------
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
  };
  // const navigation = useNavigation<NavigationProp>();
  // const scaleAnim = useRef(new Animated.Value(1)).current;
  // const [isRecording, setIsRecording] = useState(false);
  // const [isPaused, setIsPaused] = useState(false);
  // const [recordingTime, setRecordingTime] = useState(0);
  // const timerRef = useRef<any>(null);
  const [selectedDateObj, setSelectedDateObj] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  // const [modalVisible, setModalVisible] = useState(false);
  // const [title, setTitle] = useState("");
  // const [amount, setAmount] = useState("");
  // const [category, setCategory] = useState("");
  // const [date, setDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const router = useRouter();
  const [expenses, setExpenses] = useState<any[]>([]);
  // const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [editIndex, setEditIndex] = useState<string | null>(null);
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(2026, i);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  // const scaleAnim = useRef(new Animated.Value(1)).current;
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const handleLogout = async () => {
    setShowMenu(false);
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      Alert.alert(
        "Logout failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };
  console.log("Project ID:", db.app.options.projectId);
  useEffect(() => {
    let unsubscribeExpenses: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // A sign-in/out event can fire more than once while this screen is open.
      // Dispose the previous Firestore listener before subscribing again.
      unsubscribeExpenses?.();
      unsubscribeExpenses = undefined;

      if (!user) {
        console.log("❌ No user logged in");
        setExpenses([]);
        return;
      }

      console.log("✅ USER UID:", user.uid);

      unsubscribeExpenses = onSnapshot(
        collection(db, "users", user.uid, "expenses"),
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          const filtered = data.filter((item: any) => {
            const d = new Date(item.date);
            return (
              d.getMonth() === selectedDate.getMonth() &&
              d.getFullYear() === selectedDate.getFullYear()
            );
          });

          filtered.sort((a: any, b: any) => {
            return (b.createdAt || 0) - (a.createdAt || 0);
          });

          setExpenses(filtered);
        },
        (error) => {
          console.log(
            `🔥 FIRESTORE ERROR [users/${user.uid}/expenses] (${error.code}):`,
            error.message,
          );
        },
      );
      console.log("AUTH:", auth.currentUser);
    });

    return () => {
      unsubscribeExpenses?.();
      unsubscribeAuth();
    };
  }, [selectedDate]);
  // const scale = useSharedValue(1);

  // useEffect(() => {
  //   if (isRecording) {
  //     scale.value = withRepeat(withTiming(1.3, { duration: 800 }), -1, true);
  //   } else {
  //     scale.value = withTiming(1);
  //   }
  // }, [isRecording]);
  // useEffect(() => {
  //   let interval: any;

  //   if (isRecording && !isPaused) {
  //     interval = setInterval(() => {
  //       setRecordingTime((prev) => prev + 1);
  //     }, 1000);
  //   }

  //   return () => clearInterval(interval);
  // }, [isRecording, isPaused]);

  // const animatedStyle = useAnimatedStyle(() => {
  //   return {
  //     transform: [{ scale: scale.value }],
  //   };
  // });
  // 🎤 START RECORDING
  // const startRecording = async () => {
  //   try {
  //     // 🔥 IMPORTANT FIX
  //     if (isRecording || recordingRef.current) return;

  //     await Audio.requestPermissionsAsync();

  //     await Audio.setAudioModeAsync({
  //       allowsRecordingIOS: true,
  //       playsInSilentModeIOS: true,
  //     });

  //     const { recording } = await Audio.Recording.createAsync(
  //       Audio.RecordingOptionsPresets.HIGH_QUALITY,
  //     );

  //     recordingRef.current = recording;
  //     setIsRecording(true);
  //     setRecordingTime(0);
  //   } catch (err) {
  //     console.log("Recording error:", err);
  //   }
  // };
  // useEffect(() => {}, [startRecording]);

  // const pauseRecording = async () => {
  //   await recordingRef.current?.pauseAsync();
  //   setIsPaused(true);
  // };

  // const resumeRecording = async () => {
  //   await recordingRef.current?.startAsync();
  //   setIsPaused(false);
  // };
  // useEffect(() => {
  //   return () => {
  //     if (sound) {
  //       sound.unloadAsync();
  //     }
  //   };
  // }, [sound]);
  // // ⏹ STOP → DIRECT FORM
  // const stopRecording = async () => {
  //   try {
  //     if (!recordingRef.current) return;

  //     await recordingRef.current.stopAndUnloadAsync();
  //     const uri = recordingRef.current.getURI();

  //     if (!uri) return;

  //     // 🔥 SAVE IT IN STATE
  //     setRecordingURI(uri);

  //     console.log("🎤 Recorded URI:", uri);
  //     // 🔥 ADD THIS EXACTLY HERE
  //     if (!uri) return;

  //     const newPath =
  //       FileSystem.documentDirectory + `recording-${Date.now()}.m4a`;

  //     await FileSystem.copyAsync({
  //       from: uri,
  //       to: newPath,
  //     });

  //     console.log("📁 Saved to:", newPath);

  //     recordingRef.current = null;
  //     setIsRecording(false);
  //     setIsPaused(false);

  //     router.push({
  //       pathname: "/add-expense",
  //       params: {
  //         amount: "250",
  //         title: "Voice Expense",
  //         category: "Food",
  //         voice: newPath,
  //       },
  //     });
  //   } catch (err) {
  //     console.log("Stop error:", err);
  //   }
  // };

  // ▶️ PLAY FROM LIST
  // const handlePlay = async (item: any) => {
  //   try {
  //     // SAME AUDIO → toggle
  //     if (playingId === item.id && sound) {
  //       const status: any = await sound.getStatusAsync();

  //       if (status.isPlaying) {
  //         await sound.pauseAsync();
  //         setPlayingId(null);
  //       } else {
  //         await sound.playAsync();
  //         setPlayingId(item.id);
  //       }
  //       return;
  //     }

  //     // STOP previous
  //     if (sound) {
  //       await sound.stopAsync();
  //       await sound.unloadAsync();
  //     }

  //     // LOAD new
  //     await Audio.setAudioModeAsync({
  //       playsInSilentModeIOS: true,
  //     });

  //     const { sound: newSound } = await Audio.Sound.createAsync(
  //       { uri: item.voice },
  //       { shouldPlay: true }, // 🔥 IMPORTANT
  //     );
  //     setSound(newSound);
  //     setPlayingId(item.id);

  // await newSound.playAsync();

  // RESET WHEN DONE
  //     newSound.setOnPlaybackStatusUpdate((status: any) => {
  //       if (status.didJustFinish) {
  //         setPlayingId(null);
  //       }
  //     });
  //   } catch (err) {
  //     console.log("Play error:", err);
  //   }
  // };
  // const uploadVoice = async (uri: string) => {
  //   try {
  //     console.log("Uploading:", uri);

  //     const storage = getStorage(app);
  //     const filename = `voices/${Date.now()}.m4a`;
  //     const storageRef = ref(storage, filename);

  //     // 🔥 READ FILE AS BASE64
  //     const base64 = await FileSystem.readAsStringAsync(uri, {
  //       encoding: "base64",
  //     });

  //     // 🔥 CONVERT BASE64 → BLOB
  //     const blob = await fetch(`data:audio/m4a;base64,${base64}`).then((res) =>
  //       res.blob(),
  //     );

  //     await uploadBytes(storageRef, blob);

  //     const downloadURL = await getDownloadURL(storageRef);

  //     console.log("Uploaded URL:", downloadURL);

  //     return downloadURL;
  //   } catch (error) {
  //     console.log("Upload error:", error);
  //     return null;
  //   }
  // };

  const deleteExpense = async (id: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    await deleteDoc(doc(db, "users", uid, "expenses", id));
  };

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

  // 🔥 CALCULATE TOTAL
  // 🔥 TOTAL EXPENSE (KEEP THIS)
  const totalExpense = expenses.reduce((sum, item) => {
    return sum + Number(item.amount);
  }, 0);

  // 🔥 GET CURRENT DATE
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // 🔥 GET PREVIOUS MONTH
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // 🔥 CURRENT MONTH TOTAL
  const currentMonthTotal = expenses
    .filter((item) => {
      const d = new Date(item.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, item) => sum + Number(item.amount), 0);

  // 🔥 PREVIOUS MONTH TOTAL
  const previousMonthTotal = expenses
    .filter((item) => {
      const d = new Date(item.date);
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    })
    .reduce((sum, item) => sum + Number(item.amount), 0);

  // 🔥 % CHANGE
  const percentChange =
    previousMonthTotal === 0
      ? 0
      : ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100;

  const isIncrease = percentChange >= 0;
  return (
    <View style={styles.container}>
      <View style={{ marginBottom: 10 }}>
        {/* CENTER TITLE */}
        <Text
          style={{
            fontSize: 24,
            color: "#222",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          My Expenses 💰
        </Text>

        {/* RIGHT MENU BUTTON */}
        <TouchableOpacity
          onPress={() => setShowMenu(!showMenu)}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
          }}
        >
          <Feather name="more-vertical" size={24} color="#222" />
        </TouchableOpacity>
      </View>
      {/* 🔥 ADD DROPDOWN RIGHT HERE */}
      {showMenu && (
        <View
          style={{
            position: "absolute",
            top: 80,
            right: 20,
            backgroundColor: "#fff",
            borderRadius: 10,
            padding: 10,
            elevation: 8,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 5,
            zIndex: 100,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setShowMenu(false);
              router.push({
                pathname: "/analysis",
                params: {
                  expenses: JSON.stringify(expenses),
                },
              });
            }}
            style={{ padding: 10 }}
          >
            <Text style={{ fontSize: 16 }}>Analysis</Text>
          </TouchableOpacity>
          <View
            style={{
              height: 1,
              backgroundColor: "#e5e7eb",
              marginHorizontal: 8,
            }}
          />
          <TouchableOpacity onPress={handleLogout} style={{ padding: 10 }}>
            <Text style={{ fontSize: 16, color: "#dc2626" }}>Log out</Text>
          </TouchableOpacity>
        </View>
      )}
      {/* 🔥 MONTH DROPDOWN */}
      {/* <TouchableOpacity
        onPress={() => setShowDropdown(!showDropdown)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          marginVertical: 10,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "bold" }}>
          {selectedMonth}
        </Text>
        <Text style={{ marginLeft: 5 }}>▼</Text>
      </TouchableOpacity> */}
      {/* 🔽 DROPDOWN LIST */}
      {showDropdown && (
        <View
          style={{
            position: "absolute",
            top: 200,
            alignSelf: "center",
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 10,
            elevation: 8,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 10,
            width: "80%",
            zIndex: 100,
          }}
        >
          <ScrollView style={{ maxHeight: 250 }}>
            {months.map((month) => (
              <TouchableOpacity
                key={month.toISOString()}
                onPress={() => {
                  setSelectedDate(month);
                  setShowDropdown(false);
                }}
                style={{
                  padding: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#eee",
                }}
              >
                <Text style={{ color: "#222" }}>
                  {month.toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      {/* 🔥 TOTAL EXPENSE BOX (CLICKABLE) */}
      <View
        style={{
          backgroundColor: "#6c5ce7",
          shadowColor: "#6c5ce7",
          shadowOpacity: 0.5,
          shadowRadius: 10,
          elevation: 5,
          padding: 20,
          borderRadius: 15,
          marginVertical: 10,
        }}
      >
        {/* 🔥 MONTH DROPDOWN INSIDE CARD */}
        <TouchableOpacity
          onPress={() => setShowDropdown(!showDropdown)}
          style={{
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
            {selectedDate.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}{" "}
            ▼
          </Text>
        </TouchableOpacity>

        {/* 🔥 TOTAL */}
        <View style={{ alignItems: "center" }}>
          <Text style={{ color: "white", fontSize: 22, fontWeight: "bold" }}>
            ₹ {totalExpense}
          </Text>
          <Text style={{ color: "white", fontSize: 14 }}>Total Spent</Text>
        </View>
      </View>
      {/* 👉 ADD BUTTON HERE */}
      {/* <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/analysis",
            params: {
              expenses: JSON.stringify(expenses),
            },
          })
        }
        style={{
          backgroundColor: "#6c5ce7",
          padding: 12,
          borderRadius: 10,
          marginVertical: 10,
        }}
      >
        <Text style={{ color: "white", textAlign: "center" }}>
          View Analysis 📊
        </Text>
      </TouchableOpacity> */}
      {/* 🔥 RECENT TRANSACTIONS HEADER */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 20,
          marginBottom: 10,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "bold" }}>
          Recent Transactions
        </Text>

        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/all-expenses",
              params: {
                expenses: JSON.stringify(expenses),
              },
            })
          }
        >
          <Text style={{ color: "#6c5ce7", fontWeight: "bold" }}>View All</Text>
        </TouchableOpacity>
      </View>
      {/* LIST (UNCHANGED) */}
      <FlatList
        data={expenses.slice(0, 10)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 150 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            // onPress={() => editExpense(item)}
            onPress={() =>
              router.push({
                pathname: "/add-expense",
                params: {
                  expense: JSON.stringify(item),
                  isEdit: "true",
                },
              })
            }
          >
            <View style={styles.iconCircle}>
              {getCategoryIcon(item.category)}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.amount}>₹ {item.amount}</Text>
              <Text style={styles.titleText}>{item.title}</Text>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.dateText}>
                {new Date(item.date).toLocaleDateString()}
              </Text>
              <View style={styles.iconRow}>
                {/* Voice removed */}
                {/* //   <TouchableOpacity onPress={() => handlePlay(item)}>
                //     <Feather
                //       name={playingId === item.id ? "pause" : "play"} */}
                {/* //       size={18}
                //       color="#2ecc71"
                //     />
                //   </TouchableOpacity>
                // )} */}

                <TouchableOpacity onPress={() => deleteExpense(item.id)}>
                  <Feather name="trash-2" size={18} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* {isRecording && (
        <View style={styles.overlay}>
          <Animated.View style={[styles.micContainer, animatedStyle]}>
            <TouchableOpacity onPress={stopRecording}>
              <Feather name="square" size={40} color="white" />
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.recordingText}>Listening...</Text>
        </View>
      )} */}

      {/* Add Button */}
      {/* <TouchableOpacity
        style={{ position: "absolute", bottom: 20, right: 20 }}
        onPress={() => router.push("/add-expense")}
      >
        <Feather name="plus" size={32} color="black" />
      </TouchableOpacity> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 50,
    backgroundColor: "#ffffff", // 🔥 ADD THIS
  },
  title: {
    fontSize: 24,
    textAlign: "center",
    // alignSelf: "center",
    color: "#222",
  },

  expenseItem: {
    backgroundColor: "#eee",
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  text: { fontWeight: "bold" },
  actions: { flexDirection: "row", gap: 10 },
  edit: { color: "blue" },
  delete: { color: "red" },

  voiceWrapper: {
    position: "absolute",
    bottom: 20,
    left: 20,
  },

  micBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#25D366",
    justifyContent: "center",
    alignItems: "center",
  },

  recordingBar: {
    position: "absolute",
    bottom: 90,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#eee",
    padding: 12,
    borderRadius: 25,
  },

  recordingText: { color: "red", fontWeight: "bold" },
  timer: { fontWeight: "bold" },
  action: { fontSize: 22 },

  centerFabBottom: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 30,
  },

  centerFabText: { color: "#222" },

  modalContainer: { marginTop: 100, padding: 20 },

  input: {
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
    borderRadius: 5,
  },

  saveBtn: {
    backgroundColor: "green",
    padding: 12,
    alignItems: "center",
    marginTop: 10,
  },

  cancelBtn: {
    backgroundColor: "#ccc",
    padding: 12,
    alignItems: "center",
    marginTop: 10,
  },
  recordingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },

  recordingBox: {
    width: 200,
    padding: 20,
    backgroundColor: "#222",
    borderRadius: 15,
    alignItems: "center",
    elevation: 5,
  },

  iconRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },

  icon: {
    fontSize: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#f5f6fa",
    borderRadius: 20, // 🔥 updated
    padding: 15,
    marginVertical: 10, // 🔥 updated

    shadowColor: "#000", // 🔥 premium feel
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },

  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#eaeaf0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  cardContent: {
    flex: 1,
  },

  amount: {
    color: "#222",
    fontSize: 18,
    fontWeight: "bold",
  },

  titleText: {
    color: "#aaa",
    marginTop: 2,
  },

  rightSection: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  dateText: {
    color: "#aaa",
    fontSize: 12,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  micContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#6c5ce7",
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
  },
});
