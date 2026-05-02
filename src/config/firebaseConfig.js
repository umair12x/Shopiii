import { getApp, getApps, initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import {
  signInAnonymously,
  onAuthStateChanged,
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mapFirebaseAuthError = (err) => {
  if (!err || typeof err !== 'object') return err;

  if (err.code === 'auth/configuration-not-found') {
    const actionable = new Error(
      'Firebase Authentication is not configured. In Firebase Console, go to Authentication -> Get started -> Sign-in method, and enable Anonymous provider.'
    );
    actionable.code = err.code;
    actionable.originalMessage = err.message;
    return actionable;
  }

  return err;
};

import Constants from 'expo-constants';

const readEnv = (key) => {
  try {
    const extra = Constants.expoConfig && Constants.expoConfig.extra;
    if (extra && typeof extra[key] !== 'undefined' && extra[key] !== null) {
      return String(extra[key]).trim();
    }
  } catch (e) {
    // ignore
  }
  return (process.env[key] || '').trim();
};

export const firebaseConfig = {
  apiKey: readEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: readEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: readEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: readEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: readEnv('EXPO_PUBLIC_FIREBASE_APP_ID'),
  databaseURL: readEnv('EXPO_PUBLIC_FIREBASE_DATABASE_URL'),
  measurementId: readEnv('EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID'),
};

// Enable Firebase only when the web SDK config is complete.
export const FIREBASE_ENABLED = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId &&
  firebaseConfig.databaseURL
);

export const firebaseApp = FIREBASE_ENABLED
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null;

export const firebaseDatabase = firebaseApp ? getDatabase(firebaseApp) : null;

// Initialize Auth with React Native persistence when Firebase is enabled
export const firebaseAuth = firebaseApp
  ? initializeAuth(firebaseApp, { persistence: getReactNativePersistence(AsyncStorage) })
  : null;

// Ensure the app has an authenticated user (anonymous sign-in fallback)
export const ensureSignedIn = async () => {
  if (!FIREBASE_ENABLED) throw new Error('Firebase not configured');
  if (!firebaseAuth) throw new Error('Firebase Auth not available');

  // If already signed in, resolve immediately
  if (firebaseAuth.currentUser) return firebaseAuth.currentUser;

  // Try to sign in anonymously and resolve when auth state changes
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        unsubscribe();
        resolve(user);
      }
    }, (err) => {
      unsubscribe();
      reject(mapFirebaseAuthError(err));
    });

    // Attempt anonymous sign-in
    signInAnonymously(firebaseAuth).catch((err) => {
      // If sign-in fails, let onAuthStateChanged handle rejection via its error callback
      // but also reject here to avoid hanging
      try { unsubscribe(); } catch (e) {}
      reject(mapFirebaseAuthError(err));
    });
  });
};
