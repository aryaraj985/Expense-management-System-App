import { auth } from "@/firebase";
import { ActivityIndicator, View } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

export default function IndexRoute() {
  const [destination, setDestination] = useState<
    "/(tabs)/home" | "/login" | null
  >(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setDestination(user ? "/(tabs)/home" : "/login");
    });
  }, []);

  if (!destination) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Redirect href={destination} />;
}
