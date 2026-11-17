import { Feather } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";

import { stopRecordingGlobal } from "@/utils/recordingService";
import { useRecordingStore } from "@/utils/recordingState";
import { useRouter } from "expo-router";

export default function RecordingOverlay() {
  const { isRecording } = useRecordingStore();
  const router = useRouter();

  const scale = useSharedValue(1);

  React.useEffect(() => {
    if (isRecording) {
      scale.value = withRepeat(withTiming(1.3, { duration: 800 }), -1, true);
    } else {
      scale.value = withTiming(1);
    }
  }, [isRecording]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!isRecording) return null;

  const handleStop = async () => {
    const uri = await stopRecordingGlobal();

    if (!uri) return;

    router.push({
      pathname: "/add-expense",
      params: {
        amount: "250",
        title: "Voice Expense",
        category: "Food",
        voice: uri,
      },
    });
  };

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
      }}
    >
      <Animated.View
        style={[
          {
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: "#6c5ce7",
            justifyContent: "center",
            alignItems: "center",
          },
          animatedStyle,
        ]}
      >
        <TouchableOpacity onPress={handleStop}>
          <Feather name="square" size={40} color="white" />
        </TouchableOpacity>
      </Animated.View>

      <Text style={{ color: "white", marginTop: 20 }}>Listening...</Text>
    </View>
  );
}
