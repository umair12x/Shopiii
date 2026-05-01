import { getApp, getApps, initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const readEnv = (key) => (process.env[key] || '').trim();

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
