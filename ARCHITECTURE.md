# Shopiii - Architecture & Code Organization

## 📂 Project Structure

```
shopiii/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js           # Shop overview & summary
│   │   ├── DailyBookScreen.js      # Core transaction management
│   │   ├── DashboardScreen.js      # Analytics & charts
│   │   ├── PreviousAccountsScreen.js # Historical data
│   │   └── SettingsScreen.js       # Configuration
│   │
│   ├── components/
│   │   ├── SummaryCard.js          # Reusable card component
│   │   ├── EntryForm.js            # Transaction input modal
│   │   ├── EntryItem.js            # Individual transaction display
│   │   └── TotalsSummary.js        # Fixed totals header
│   │
│   ├── context/
│   │   └── DataContext.js          # Global state management
│   │
│   ├── utils/
│   │   ├── currencyFormatter.js    # PKR formatting & number helpers
│   │   └── dateUtils.js            # Date manipulation utilities
│   │
│   └── config/
│       ├── colors.js               # Theme & color constants
│       └── firebaseConfig.js       # Firebase configuration
│
├── App.js                          # Navigation setup
├── app.json                        # Expo configuration
├── package.json                    # Dependencies
├── README.md                       # Full documentation
├── QUICKSTART.md                   # Quick start guide
└── ARCHITECTURE.md                 # This file
```

## 🔄 Data Flow Architecture

```
┌─────────────────────────────────────┐
│         App.js (Navigation)         │
│  (Stack & Tab Navigation Setup)     │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│      DataProvider (Context)         │
│  (Global State Management via       │
│   AsyncStorage)                     │
└────────────────┬────────────────────┘
                 │
    ┌────────────┼────────────────┐
    │            │                │
    ▼            ▼                ▼
┌─────────┐ ┌──────────┐ ┌──────────────┐
│ Screens │ │Components│ │ Utilities    │
│         │ │          │ │              │
│ Home    │ │Summary   │ │ Formatters   │
│ Daily   │ │Entry     │ │ Date Utils   │
│ Book    │ │Total     │ │ Colors      │
│ Dashboard│ │Form     │ │ Firebase    │
│ History │ │          │ │              │
│ Settings│ │          │ │              │
└─────────┘ └──────────┘ └──────────────┘
```

## 📊 State Management (DataContext)

### Context provides:
- `entries`: Current day's entries array
- `shopDetails`: Shop information object
- `selectedDate`: Currently viewed date
- `loading`: Loading state indicator

### Key Methods:
```javascript
// CRUD Operations
addEntry(entry)              // Add new transaction
updateEntry(id, data)        // Update existing transaction
deleteEntry(id)              // Remove transaction
togglePaymentStatus(id)      // Toggle Pending/Collected

// Data Querying
calculateTotals()            // Get today's summary stats
getEntriesForDateRange()     // Query historical data
formatDateKey(date)          // Convert date to storage key

// Configuration
updateShopDetails(details)   // Update shop information
changeDate(date)             // Switch active date
```

## 💾 Data Structure

### Entry Object
```javascript
{
  id: "1714464721234",           // Unique timestamp-based ID
  date: "2024-04-30",            // YYYY-MM-DD format
  itemName: "Item 1",            // User-defined item name
  purchasePrice: 100,            // Cost to business
  salePrice: 150,                // Selling price
  profit: 50,                    // Auto-calculated (sale - purchase)
  isPaymentCollected: false,     // Payment status toggle
  createdAt: "2024-04-30T10:30:00Z" // Timestamp
}
```

### Shop Details Object
```javascript
{
  name: "Shopiii",               // Shop name
  owner: "Your Name",            // Owner name
  address: "123 Main St",        // Shop address
  contact: "+92-300-1234567"    // Contact number
}
```

### AsyncStorage Keys
- `shopDetails`: Shop configuration
- `entries_2024-04-30`: Entries for specific date (one key per date)
- Format: `entries_${YYYY-MM-DD}`

## 🎨 Component Hierarchy

```
App.js
├── NavigationContainer
│   └── Stack Navigator
│       └── Tab Navigator
│           ├── HomeScreen
│           │   └── SummaryCard × 4
│           ├── DailyBookScreen
│           │   ├── TotalsSummary (Fixed)
│           │   ├── FlatList
│           │   │   └── EntryItem × N
│           │   ├── EntryForm (Modal)
│           │   └── + Add Button
│           ├── DashboardScreen
│           │   ├── LineChart (30 days)
│           │   └── BarChart (Year)
│           ├── PreviousAccountsScreen
│           │   ├── DatePicker (Modal)
│           │   ├── TotalsSummary
│           │   └── FlatList
│           │       └── EntryItem × N (Read-only)
│           └── SettingsScreen
│               └── Form Controls
```

## 🔌 Dependencies & Versions

### Navigation (React Navigation 7.x)
- `@react-navigation/native`: Core navigation
- `@react-navigation/native-stack`: Stack navigator
- `@react-navigation/bottom-tabs`: Tab navigator
- `react-native-screens`: Native screen management
- `react-native-safe-area-context`: Safe area support
- `react-native-gesture-handler`: Gesture detection

### Storage & Backend
- `@react-native-async-storage/async-storage`: Local storage
- `firebase`: Cloud integration (optional)

### UI & Visualization
- `react-native-chart-kit`: Charts rendering
- `react-native-date-picker`: Date selection
- `react-native-svg`: SVG support (for charts)

### Framework
- `expo`: React Native framework
- `react`: React core
- `react-native`: React Native core

## 🔄 Key Workflows

### Adding a Transaction
1. User taps **+ Add Entry** button
2. EntryForm modal opens
3. User inputs Item Name, Purchase Price, Sale Price
4. Form submission calls `DataContext.addEntry()`
5. Entry saved to AsyncStorage with auto-generated ID
6. FlatList re-renders to show new entry

### Viewing Analytics
1. User navigates to Dashboard tab
2. DashboardScreen queries last 30 days using `getEntriesForDateRange()`
3. Data aggregated by date
4. LineChart renders sales trends
5. User can toggle between "30 Days" and "This Year"

### Tracking Payment
1. User taps payment button on entry (Pending/Collected)
2. `togglePaymentStatus()` called
3. `isPaymentCollected` boolean flipped
4. Updated entry saved
5. Visual indicator changes (color/border)

### Viewing History
1. User selects date from DatePicker
2. `changeDate()` updates selectedDate in context
3. `loadEntriesForDate()` queries AsyncStorage
4. Entries for selected date loaded
5. TotalsSummary recalculates with historical data

## 🎨 Styling Architecture

### Theme System (config/colors.js)
- **Centralized color palette**: All colors defined in one place
- **THEME object**: Spacing, fonts, border radius
- **Semantic colors**: Status-based colors (success, error, warning)

### Component Styling
- **StyleSheet**: React Native StyleSheet for performance
- **Conditional styles**: Dynamic styling based on data
- **Responsive**: Uses flexible layouts

### Color Usage Pattern
```javascript
// Example from EntryItem
const bgColor = isProfit ? COLORS.profitGreen : isLoss ? COLORS.lossRed : COLORS.light;
const borderColor = entry.isPaymentCollected ? COLORS.success : COLORS.warning;
```

## 🔐 LocalStorage Strategy

### Data Persistence
- Uses AsyncStorage for local-only persistence
- Each date has separate storage key
- Data survives app restarts
- No synchronization overhead

### Backup & Cloud Sync (Future)
- Firebase config placeholder included
- Can be upgraded to cloud sync
- Will allow multi-device access
- Automatic backup capability

## ⚙️ Configuration

### Firebase Setup (Optional)
1. Create Firebase project
2. Get credentials from console
3. Update `src/config/firebaseConfig.js`
4. Set `FIREBASE_ENABLED = true`
5. Add Firestore security rules

### Shop Details
- Editable via Settings screen
- Stored in AsyncStorage
- Used across app for branding

## 🧪 Testing Considerations

### Unit Testing
- Utility functions (formatCurrency, dateUtils)
- DataContext reducer functions
- Component prop validation

### Integration Testing
- Navigation flow
- Data persistence (AsyncStorage)
- Form submission workflow

### E2E Testing
- Complete user journey
- Transaction lifecycle
- Analytics calculations

## 🚀 Deployment Checklist

- [ ] App version updated in app.json
- [ ] Shop details configured
- [ ] Test on Android device
- [ ] Test on iOS device
- [ ] Test on web browser
- [ ] Verify all data persistence
- [ ] Review analytics calculations
- [ ] Check edge cases (no data, large datasets)

## 📈 Performance Optimizations

### Implemented
- FlatList for efficient list rendering
- Context-based state avoids prop drilling
- StyleSheet for optimized styles
- AsyncStorage querying by date

### Potential Future
- Pagination for large datasets
- Memoization of components
- Lazy loading of screens
- Caching of analytics calculations

## 🔮 Future Architecture Changes

### Phase 2 (Cloud Sync)
- Firebase Firestore integration
- Multi-device synchronization
- User authentication

### Phase 3 (Enhanced Features)
- Inventory management
- Customer relationship tracking
- SMS notifications
- PDF generation

### Phase 4 (Business Intelligence)
- Advanced analytics
- Forecasting
- Tax calculation helpers
- Multi-location support

---

**Architecture Version**: 1.0
**Last Updated**: April 2026
**Status**: Production Ready
