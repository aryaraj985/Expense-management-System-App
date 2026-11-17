import { auth, db } from "@/firebase";
import { addDoc, collection } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ChatScreen() {
  const baseQuestions = [
    { key: "profession", text: "What is your profession? (student / working)" },
  ];

  const studentQuestions = [
    { key: "city", text: "Where do you live?" },
    { key: "monthlyBudget", text: "What is your monthly pocket money?" },
    { key: "foodExpense", text: "Monthly food expense?" },
    { key: "eatOutside", text: "Do you eat outside frequently?" },
  ];

  const workingQuestions = [
    { key: "city", text: "Where do you live?" },
    { key: "monthlyBudget", text: "What is your monthly income?" },
    { key: "married", text: "are you married?" },
    { key: "children", text: "do you have child?" },
    { key: "children", text: "how many children?" },
    { key: "school", text: "What is the school fees?" },

    { key: "hasEMI", text: "Do you have any EMI or loans?" },
    { key: "foodExpense", text: "Monthly food expense?" },
    { key: "savingsGoal", text: "How much do you want to save monthly?" },
  ];
  // ✅ STATES
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState(0);
  const [userData, setUserData] = useState<any>({});
  const [questions, setQuestions] = useState(baseQuestions);
  // ✅ INITIAL MESSAGE
  useEffect(() => {
    setMessages([
      {
        id: "1",
        text: "Hi 👋 Let’s understand your lifestyle.",
        sender: "bot",
      },
      {
        id: "2",
        text: baseQuestions[0].text,
        sender: "bot",
      },
    ]);
  }, []);
  // ✅ SEND MESSAGE
  const sendMessage = () => {
    if (!input) return;

    const userMsg = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMsg]);

    handleBotResponse(input);

    setInput("");
  };

  // ✅ BOT LOGIC
  const handleBotResponse = (text: string) => {
    const currentQuestion = questions[step];
    // 🔥 STEP 0 → decide flow
    if (step === 0) {
      const profession = text.toLowerCase().trim();

      let newQuestions = [];

      if (profession.includes("student")) {
        newQuestions = [...baseQuestions, ...studentQuestions];
      } else {
        newQuestions = [...baseQuestions, ...workingQuestions];
      }

      setQuestions(newQuestions);
    }
    setUserData((prev: any) => ({
      ...prev,
      [currentQuestion.key]: text,
    }));

    const nextStep = step + 1;

    if (nextStep < questions.length) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            text: questions[nextStep].text,
            sender: "bot",
          },
        ]);
      }, 500);

      setStep(nextStep);
    } else {
      generateSummary();
    }
  };

  // ✅ SUMMARY
  const generateSummary = async () => {
    console.log("🔥 generateSummary called");

    const categories = generateCategories(userData);
    console.log("📦 Categories:", categories);
    const summary = `
📊 Your Profile:

Profession: ${userData.profession}
City: ${userData.city}
Monthly Budget: ₹${userData.monthlyBudget}

🧠 Smart Categories Created:

${categories.map((c) => `${c.name}: ₹${c.budget}`).join("\n")}
`;

    // SHOW MESSAGE
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text: summary,
        sender: "bot",
      },
    ]);
    console.log("💾 Saving to Firebase...");
    // SAVE TO FIREBASE
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      await addDoc(collection(db, "users", uid, "budgets"), {
        totalBudget: Number(userData.monthlyBudget) || 0,
        categories: categories,
        userData: userData,
        month: new Date().toISOString().slice(0, 7),
        createdAt: new Date(),
      });
      console.log("✅ Saved successfully");
    } catch (error) {
      console.log("Save Error:", error);
    }
  };

  const generateCategories = (data: any) => {
    const categories: any[] = [];

    const budget = Number(data.monthlyBudget) || 0;
    const profession = data.profession?.toLowerCase().trim() || "";
    // ✅ FOOD (common)
    categories.push({
      name: "Food",
      budget: Number(data.foodExpense) || Math.round(budget * 0.2),
    });

    // 👨‍🎓 STUDENT LOGIC
    if (profession.includes("student")) {
      categories.push({
        name: "Entertainment",
        budget: Math.round(budget * 0.2),
      });

      categories.push({
        name: "Savings",
        budget: Math.round(budget * 0.1),
      });
    }

    // 👨‍💼 WORKING LOGIC
    else {
      // EMI
      if (data.hasEMI?.toLowerCase() === "yes") {
        categories.push({
          name: "EMI",
          budget: Math.round(budget * 0.3),
        });
      }

      // Rent
      categories.push({
        name: "Rent",
        budget: Math.round(budget * 0.3),
      });

      // Savings
      categories.push({
        name: "Savings",
        budget: Math.round(budget * 0.2),
      });
    }

    return categories;
  };
  // ✅ RESET CHAT
  const resetChat = () => {
    setStep(0);
    setUserData({});
    setMessages([
      {
        id: "1",
        text: "Let’s start again 😊",
        sender: "bot",
      },
      {
        id: "2",
        text: questions[0].text,
        sender: "bot",
      },
    ]);
  };

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text
            style={{
              alignSelf: item.sender === "user" ? "flex-end" : "flex-start",
              backgroundColor: item.sender === "user" ? "#6c5ce7" : "#eee",
              color: item.sender === "user" ? "white" : "black",
              padding: 10,
              margin: 5,
              borderRadius: 10,
            }}
          >
            {item.text}
          </Text>
        )}
      />

      {/* ✅ RESET BUTTON */}
      <TouchableOpacity onPress={resetChat}>
        <Text style={{ color: "blue", textAlign: "center", margin: 10 }}>
          Start New Chat
        </Text>
      </TouchableOpacity>

      {/* INPUT */}
      <View style={{ flexDirection: "row" }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type..."
          style={{ flex: 1, borderWidth: 1, padding: 10 }}
        />
        <TouchableOpacity onPress={sendMessage}>
          <Text style={{ padding: 10 }}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
