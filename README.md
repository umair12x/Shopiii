# Shopiii Documentation

This folder contains the current reference docs for Shopiii.

## Start here

- [Setup guide](SETUP.md)
- [Architecture overview](ARCHITECTURE.md)
- [Feature guide](FEATURES.md)
- [Data model](DATA_MODEL.md)
- [Firebase sync guide](FIREBASE.md)
- [Troubleshooting](TROUBLESHOOTING.md)

## Also useful

- [Main project README](../README.md)
- [Quick start guide](../QUICKSTART.md)
- [Project completion summary](../COMPLETE.md)

## What Shopiii does

Shopiii is a React Native Expo app for shop accounting, daily sales entry, product barcode tracking, offline-first local storage, and optional Firebase cloud backup.

## Current scope

- Home summary and sync status
- Daily Book transaction management
- Products barcode catalog
- History and date-based review
- Dashboard analytics
- Settings and shop profile editing

## Firebase note

Cloud sync requires Firebase Authentication with Anonymous provider enabled and Realtime Database rules that match the active auth state.