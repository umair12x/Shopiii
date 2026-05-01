# Shopiii - Firebase Sync Guide

## Purpose

Firebase is optional and is used for cloud backup and restoring shop data across devices.

## Required Firebase Console setup

1. Create or open your Firebase project
2. Go to **Authentication**
3. Click **Get started** if needed
4. Open **Sign-in method**
5. Enable **Anonymous** provider
6. Go to **Realtime Database** and create the database if needed

## Required environment values

Set the Expo public Firebase variables listed in [SETUP.md](SETUP.md).

## Runtime behavior

The app:

- Uses anonymous auth when available
- Shows clear sync status in Home
- Stores sync metadata locally
- Falls back to local-only mode if Firebase is not configured

## Suggested database rules

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

## Development-only open rules

Use only for temporary testing:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

## Common sync errors

- `auth/configuration-not-found`: Anonymous provider is not enabled
- `PERMISSION_DENIED`: Realtime Database rules are blocking access
- `Firebase not configured`: missing required env values