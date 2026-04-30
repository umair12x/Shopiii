# 🛍️ Shopiii - Digital Account Book

A comprehensive React Native (Expo) mobile application for tracking sales, purchases, and profits for small businesses and shops. Replace traditional Excel sheets with a professional digital account book.

## 📋 Features

### 1. **Home Page** 🏠
- Display shop details (name, owner, address, contact)
- Today's profit and sales summary cards
- Quick tips and navigation

### 2. **Daily Book** 📝 (Core Feature)
- Add, edit, and delete transaction entries
- Automatic profit calculation
- Payment status tracking (Pending vs Collected)
- Conditional styling based on profit/loss
- Fixed header with totals:
  - Total Investment
  - Total Sales
  - Total Profit
  - Cash in Hand
  - Pending Amount

### 3. **Analytics Dashboard** 📊
- 30-day sales trend visualization
- Monthly profit chart for current year
- Key metrics and statistics
- Switching between different time periods

### 4. **Account History** 📋
- View past transactions by date
- Calendar/date picker integration
- Read-only view of historical data

## 🎨 Design Features

- **Color Scheme**: 
  - Primary: #990302 (Deep Red)
  - Secondary: #0a7273 (Teal)
  - Accent: #fda521 (Orange)
  - Neutral: #e9e3d5 (Beige), #033043 (Dark Blue)

- **Conditional Styling**:
  - Profit entries: Light Green background (#d4edda)
  - Loss entries: Light Red background (#f8d7da)
  - Pending payments: Yellow border (#fff3cd)
  - Collected payments: Green indicator

- **Icons**: Emoji-based icons throughout (no external icon libraries)

## 🛠️ Tech Stack

- **Framework**: React Native (Expo ~54.0)
- **Navigation**: React Navigation 7.x (Stack & Tab)
- **Storage**: AsyncStorage (Local) + Firebase (Optional)
- **Charts**: react-native-chart-kit
- **Date Picker**: react-native-date-picker
- **SVG Support**: react-native-svg
- **Currency**: Formatted for Pakistani Rupee (PKR)

## 📦 Installation

### Prerequisites
- Node.js 16+ and npm/pnpm
- Expo CLI (`npm install -g expo-cli`)
- A mobile device with Expo Go app (optional, for testing)

### Setup Steps

1. **Clone/Navigate to Project**
```bash
cd shopiii
```

2. **Install Dependencies**
```bash
pnpm install
# or
npm install
```

3. **Run Development Server**
```bash
pnpm start
# or
npm start
```

4. **Run on Platform**
- Android: Press `a` or run `expo start --android`
- iOS: Press `i` or run `expo start --ios`
- Web: Press `w` or run `expo start --web`

## 📁 Project Structure

```
shopiii/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js
│   │   ├── DailyBookScreen.js
│   │   ├── DashboardScreen.js
│   │   └── PreviousAccountsScreen.js
│   ├── components/
│   │   ├── SummaryCard.js
│   │   ├── EntryForm.js
│   │   ├── EntryItem.js
│   │   └── TotalsSummary.js
│   ├── context/
│   │   └── DataContext.js
│   ├── utils/
│   │   ├── currencyFormatter.js
│   │   └── dateUtils.js
│   └── config/
│       ├── colors.js
│       └── firebaseConfig.js
├── App.js
├── app.json
├── package.json
└── index.js
```

## 💾 Data Structure

Each transaction entry follows this structure:

```json
{
  "id": "unique_id_timestamp",
  "date": "2024-01-15",
  "itemName": "Item 1",
  "purchasePrice": 100,
  "salePrice": 150,
  "profit": 50,
  "isPaymentCollected": false,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

## 🔐 Firebase Setup (Optional)

To enable cloud sync and backup:

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project named "Shopiii"
   - Enable Realtime Database or Firestore

2. **Get Firebase Credentials**
   - Go to Project Settings → Service Accounts
   - Copy your config values

3. **Update Firebase Config**
   - Edit `src/config/firebaseConfig.js`
   - Replace placeholder values with your credentials
   - Set `FIREBASE_ENABLED = true`

4. **Security Rules** (Firestore)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 📊 Key Data Logic

### Profit Calculation
```javascript
profit = salePrice - purchasePrice
```

### Cash in Hand
```javascript
cashInHand = totalSalesOfCollectedPayments
```

### Pending Amount
```javascript
pendingAmount = totalSalesOfPendingPayments
```

### Totals
- **Total Investment**: Sum of all purchase prices
- **Total Sales**: Sum of all sale prices
- **Total Profit**: Sum of all profits (positive or negative)

## 🎯 Usage Guide

### Adding a Transaction
1. Go to **Daily Book** tab
2. Tap **+ Add Entry** button
3. Enter Item Name, Purchase Price, Sale Price
4. Confirm to add

### Editing a Transaction
1. Find the entry in Daily Book
2. Tap **✎ Edit** button
3. Update details
4. Confirm to save

### Tracking Payment
1. Each entry shows **Pending** or **✓ Collected** button
2. Tap to toggle payment status
3. Pending payments show with yellow border

### Viewing Analytics
1. Go to **Analytics** tab
2. Choose between **Last 30 Days** or **This Year**
3. View trends and key metrics

### Checking History
1. Go to **History** tab
2. Tap calendar icon to select date
3. View all entries for that date

## 📝 Notes

- All data is stored locally using AsyncStorage
- Currency is formatted for Pakistani Rupee
- No internet required for basic functionality
- Firebase sync is optional and can be added later

## 🐛 Troubleshooting

### App Won't Start
- Clear cache: `expo start -c`
- Reinstall packages: `rm -rf node_modules && pnpm install`

### Data Not Saving
- Check AsyncStorage permissions
- Ensure app has storage permissions on device

### Charts Not Showing
- Verify react-native-chart-kit is installed
- Check data exists for selected date range

## 🚀 Future Enhancements

- [ ] Sync with cloud (Firebase)
- [ ] Export data to CSV/PDF
- [ ] Multi-user support
- [ ] Expense categories
- [ ] SMS reminders for pending payments
- [ ] Customer management
- [ ] Graphical inventory tracking

## 📄 License

MIT License - Feel free to use and modify

## 👨‍💻 Support

For issues or feature requests, feel free to reach out!

---

**Made with ❤️ for small business owners**
