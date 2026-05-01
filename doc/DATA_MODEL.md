# Shopiii - Data Model

## Entry schema

Each Daily Book record is stored as an object shaped like this:

```json
{
  "id": "1714464721234",
  "date": "2026-05-01",
  "itemName": "Notebook",
  "purchasePrice": 50,
  "salePrice": 75,
  "profit": 25,
  "isPaymentCollected": false,
  "createdAt": "2026-05-01T10:30:00.000Z"
}
```

## Product schema

Product prices use this shape:

```json
{
  "id": "1714464721234",
  "barcode": "1234567890",
  "productName": "Pen",
  "purchasePrice": 10,
  "salePrice": 15,
  "notes": "Blue ink",
  "createdAt": "2026-05-01T10:30:00.000Z",
  "updatedAt": "2026-05-01T11:00:00.000Z"
}
```

## Shop details schema

```json
{
  "name": "Shopiii",
  "owner": "Your Name",
  "address": "Shop Address",
  "contact": "+92-000-0000000"
}
```

## AsyncStorage keys

- `shopDetails`
- `product_prices`
- `entries_YYYY-MM-DD`
- `syncMetadata`

## Sync metadata schema

```json
{
  "isSynced": true,
  "lastSyncTime": "2026-05-01T10:30:00.000Z",
  "lastDataModified": "2026-05-01T10:25:00.000Z"
}
```

## Totals logic

- Investment = sum of purchase prices
- Sales = sum of sale prices
- Profit = sum of per-entry profit
- Pending amount = sum of sale prices for unpaid entries
- Collected amount = sum of sale prices for paid entries