# Quick Start Guide for Shopiii

## Getting Started (5 minutes)

### Step 1: Start the App
```bash
cd shopiii
pnpm start
```

### Step 2: Choose Your Platform
- **Android**: Press `a` in terminal or run `pnpm android`
- **iOS**: Press `i` in terminal or run `pnpm ios`
- **Web**: Press `w` in terminal or run `pnpm web`

### Step 3: Configure Shop Details
1. Go to **Settings** tab
2. Tap **Edit**
3. Update:
   - Shop Name
   - Owner Name
   - Address
   - Contact Number
4. Click **Save Changes**

## Main Features

### Daily Book (Add Transactions)
1. Go to **Daily Book** tab
2. Click **+ Add Entry**
3. Fill in:
   - **Item Name**: What did you sell?
   - **Purchase Price**: What did it cost you?
   - **Sale Price**: What did you sell it for?
4. **Profit** is calculated automatically
5. Click **Add Entry**

### Payment Status
- Each entry shows **Pending** or **Collected**
- Click the button to toggle status
- Pending items show with a yellow border
- Only "Collected" amounts count toward "Cash in Hand"

### Edit or Delete
- Tap **Edit** to modify an entry
- Tap **Delete** to remove an entry

### Analytics Dashboard
- View **Sales Trends** for the last 30 days
- View **Monthly Profits** for the current year
- Check average daily sales and profit

### Account History
- Select any past date to view transactions
- Read-only view of historical data
- Useful for reconciliation

### Totals Display
Every page shows:
- **Investment**: Total cost of all items
- **Sales**: Total sales amount
- **Profit**: Total profit/loss
- **Collected**: Cash already received
- **Pending**: Money yet to be received

## User Tips

1. **End of Day**: Mark all collected payments at the end of the day
2. **Profit Tracking**: Green row = profit, Red row = loss
3. **Review**: Check Dashboard weekly to see trends
4. **History**: Use History tab to verify previous days' records
5. **Backup**: Consider connecting with Firebase later for cloud backup

## Data Entry

### Quick Entry Tips
- Item names auto-populate (Item 1, Item 2, etc.)
- Use standard pricing without decimals for quick entry
- You can add up to 100+ items per day

### Examples
```
Item Name: Notebook
Cost Price: 50
Sale Price: 75
Profit: 25

Item Name: Pen
Cost Price: 10
Sale Price: 8
Profit: -2
```

## Troubleshooting

### "App crashes on startup"
```bash
# Clear cache and restart
pnpm start -c
```

### "Can't add entries"
- Check that all fields are filled
- Ensure numbers are valid (not letters)

### "Data disappeared"
- App stores data locally on your phone
- Make sure you don't clear app data

### "Firebase error(auth/configuration-not-found)"
1. Open Firebase Console for your project
2. Go to **Authentication -> Get started**
3. Open **Sign-in method**
4. Enable **Anonymous** provider
5. Restart the app

## Shop Details

You can update shop details anytime:
1. Go to **Settings**
2. Tap **Edit**
3. Update any information
4. Click **Save Changes**

These details appear on the Home page.

## How the Colors Work

| Color | Meaning |
|-------|---------|
| Light Green | Profit (Positive) |
| Light Red | Loss (Negative) |
| Yellow | Pending Payment |
| Green Button | Collected Payment |
| Yellow Button | Pending Payment |

## Common Questions

**Q: Where is my data stored?**
A: Locally on your phone in AsyncStorage. No internet needed!

**Q: Can I backup my data?**
A: Yes! Set up Firebase in the future for cloud backup.

**Q: Can I use on multiple devices?**
A: Currently local only. Cloud sync coming soon!

**Q: Is there a web version?**
A: Yes! Run `pnpm web` to use on desktop browser.

**Q: Can I export data?**
A: Feature coming soon. Currently view in History tab.

## Daily Routine

1. **Morning**: 
   - Check yesterday's totals in History
   
2. **Throughout Day**:
   - Add entries in Daily Book as you make sales
   
3. **Noon**:
   - Quick check of today's profit in Daily Book
   
4. **Evening**:
   - Mark all collected payments
   - Review finalized totals
   
5. **Weekly**:
   - Check Analytics for trends

## Data Integrity

- **Automatic**: Profit calculated automatically
- **Secure**: Local storage, no external servers
- **Backup Ready**: Easy to add cloud sync later
- **Reliable**: Works offline

---

**Ready to go!** Start adding your first entry now!
