import { getApp, getApps, initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import {
  signInAnonymously,
  onAuthStateChanged,
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra || {};

export const firebaseConfig = {
  apiKey: extra.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: extra.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: extra.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: extra.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: extra.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: extra.EXPO_PUBLIC_FIREBASE_APP_ID,
  databaseURL: extra.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  measurementId: extra.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const hasRequiredFirebaseConfig =
  !firebaseConfig.apiKey ||
  !firebaseConfig.projectId ||
  !firebaseConfig.appId ||
  !firebaseConfig.databaseURL;

export const FIREBASE_ENABLED = !hasRequiredFirebaseConfig;

// App init (optional): keep app usable when Firebase env vars are missing.
export const firebaseApp = FIREBASE_ENABLED
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

// Database
export const firebaseDatabase = firebaseApp ? getDatabase(firebaseApp) : null;

// Auth (safe initialization)
let auth;

if (firebaseApp) {
  try {
    auth = initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e) {
    // already initialized -> fallback
    auth = getAuth(firebaseApp);
  }
}

export const firebaseAuth = auth;

// Sign-in helper
export const ensureSignedIn = async () => {
  if (!firebaseAuth) {
    throw new Error("Firebase not configured");
  }

  if (firebaseAuth.currentUser) return firebaseAuth.currentUser;

  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      firebaseAuth,
      (user) => {
        if (user) {
          unsubscribe();
          resolve(user);
        }
      },
      (err) => {
        unsubscribe();
        reject(err);
      }
    );

    signInAnonymously(firebaseAuth).catch((err) => {
      unsubscribe();
      reject(err);
    });
  });
};