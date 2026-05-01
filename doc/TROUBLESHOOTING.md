# Shopiii - Troubleshooting

## App does not start

- Run `pnpm install`
- Restart Metro with `pnpm start -c`

## Firebase sync fails

- Enable Anonymous auth in Firebase Console
- Check Realtime Database rules
- Confirm all Firebase env vars are present
- Restart the app after changing env vars or console settings

## Permission denied from Firebase

This usually means your Realtime Database rules are too strict for the current auth state.

## Barcode scanner not opening

- Test on Android or iPhone device/simulator with camera support
- Allow camera permission when prompted

## Data seems missing

- Shop data is stored locally in AsyncStorage
- Check that the selected date is correct in History/Daily Book

## Charts are empty

- Add entries for the selected range
- Verify there is at least one numeric sale/profit value