# Shopiii - Setup Guide

## Requirements

- Node.js 16+
- pnpm
- Expo Go on a phone or Android/iOS simulator

## Install

```bash
pnpm install
```

## Run

```bash
pnpm start
```

## Platform shortcuts

- Android: `pnpm android`
- iOS: `pnpm ios`
- Web: `pnpm web`

## Environment variables for Firebase

If you want cloud sync, define these Expo public variables:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_DATABASE_URL`

Firebase becomes active only when the required values are present.

## First run checklist

1. Start the app
2. Open Settings and save your shop profile
3. Add a Daily Book entry
4. Check the Dashboard and History tabs
5. Optional: configure Firebase backup