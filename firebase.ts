import { initializeApp } from "firebase/app";
import * as FirebaseAuth from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyBXkVouVcClJc4J1l435HRQEiM-isN1I40",
  authDomain: "expense-app-ddd1e.firebaseapp.com",
  projectId: "expense-app-ddd1e",
  storageBucket: "expense-app-ddd1e.firebasestorage.app",
  messagingSenderId: "429548313328",
  appId: "1:429548313328:web:876a484e6849b53f79c035",
  measurementId: "G-W2MHCF1LW9",
};

const app = initializeApp(firebaseConfig);

// Firebase's default React Native auth uses in-memory persistence. Initialize
// it with AsyncStorage so native sessions persist across app launches. The
// `firebase/auth` React Native entry exports this helper at runtime, although
// Firebase 10.12's shared TypeScript declarations omit it.
type ReactNativeAuthExports = typeof FirebaseAuth & {
  getReactNativePersistence: (storage: typeof ReactNativeAsyncStorage) => unknown;
};

export const auth = (() => {
  if (Platform.OS === "web") {
    return FirebaseAuth.getAuth(app);
  }

  const getReactNativePersistence = (FirebaseAuth as ReactNativeAuthExports)
    .getReactNativePersistence;

  try {
    return FirebaseAuth.initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage) as never,
    });
  } catch (error) {
    // Fast Refresh may evaluate this module more than once after Auth exists.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "auth/already-initialized"
    ) {
      return FirebaseAuth.getAuth(app);
    }
    throw error;
  }
})();

// ✅ FIRESTORE
export const db = getFirestore(app);

export { app };
