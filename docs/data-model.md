# dashWorth — Data Model

All data is stored locally in the user's browser using IndexedDB (via Dexie.js).
No data ever leaves the device unless the user explicitly exports it.

## Entities

### Category

Grouping for assets. Comes with sensible defaults, user can create custom ones.

| Field | Type | Description |
|-------|------|-------------|
| id | `string` | Unique identifier (uuid) |
| name | `string` | Display name (e.g. "Crypto", "Real Estate") |
| icon | `string` | Lucide icon name (e.g. "bitcoin", "home") |
| color | `string` | Tailwind color class (e.g. "orange", "blue") |
| sortOrder | `number` | Display order in lists |
| isDefault | `boolean` | Whether this is a built-in category (cannot be deleted) |
| createdAt | `Date` | Creation timestamp |

#### Default Categories

| Name | Icon | Color |
|------|------|-------|
| Crypto | `bitcoin` | `orange` |
| Stocks | `trending-up` | `blue` |
| Real Estate | `home` | `emerald` |
| Domains | `globe` | `purple` |
| Gaming | `gamepad-2` | `red` |
| Cash & Savings | `banknote` | `green` |
| Vehicles | `car` | `slate` |
| Collectibles | `gem` | `amber` |
| Other | `box` | `zinc` |

### Asset

A single item of value that the user tracks.

| Field | Type | Description |
|-------|------|-------------|
| id | `string` | Unique identifier (uuid) |
| name | `string` | Display name (e.g. "Bitcoin", "Apartment Prague 6", "AWP Dragon Lore") |
| categoryId | `string` | Reference to Category.id |
| currency | `"CZK" \| "EUR" \| "USD"` | Currency of the value |
| currentValue | `number` | Current value in the specified currency |
| notes | `string?` | Optional notes |
| isArchived | `boolean` | Soft-delete / hide from active view (default: false) |
| createdAt | `Date` | Creation timestamp |
| updatedAt | `Date` | Last update timestamp |

### Snapshot

A point-in-time record of all asset values. This is the foundation for historical charts.

| Field | Type | Description |
|-------|------|-------------|
| id | `string` | Unique identifier (uuid) |
| date | `Date` | Snapshot date (user can backdate) |
| entries | `SnapshotEntry[]` | Array of asset values at this point in time |
| totalNetWorth | `number` | Sum of all entries converted to primary currency |
| primaryCurrency | `string` | Currency used for totalNetWorth calculation |
| note | `string?` | Optional note (e.g. "After selling apartment") |
| createdAt | `Date` | Creation timestamp |

### SnapshotEntry

Individual asset value within a snapshot. Denormalized for historical integrity —
if an asset is later renamed or deleted, the snapshot still has the original data.

| Field | Type | Description |
|-------|------|-------------|
| assetId | `string` | Reference to Asset.id |
| assetName | `string` | Asset name at time of snapshot (denormalized) |
| categoryId | `string` | Category at time of snapshot (denormalized) |
| value | `number` | Value at time of snapshot |
| currency | `string` | Currency at time of snapshot |

### UserSettings

User preferences stored in IndexedDB.

| Field | Type | Description |
|-------|------|-------------|
| id | `string` | Always "settings" (singleton) |
| primaryCurrency | `"CZK" \| "EUR" \| "USD"` | Default display currency |
| theme | `"dark" \| "light" \| "system"` | UI theme preference |
| snapshotReminder | `"weekly" \| "monthly" \| "none"` | Reminder frequency |
| lastSnapshotDate | `Date?` | When the last snapshot was taken |

## Dexie Schema

```typescript
const db = new Dexie('dashworth') as DashWorthDB;

db.version(1).stores({
  categories: 'id, name, sortOrder',
  assets: 'id, categoryId, name, isArchived, updatedAt',
  snapshots: 'id, date, createdAt',
  settings: 'id',
});
```

## Export Format

The JSON export includes all tables and a metadata header:

```json
{
  "app": "dashworth",
  "version": 1,
  "exportedAt": "2026-02-07T12:00:00Z",
  "data": {
    "categories": [],
    "assets": [],
    "snapshots": [],
    "settings": {}
  }
}
```

## Notes

- All IDs are UUIDs generated client-side via `crypto.randomUUID()`
- Dates are stored as ISO strings in IndexedDB
- SnapshotEntry data is denormalized intentionally — snapshots must remain accurate even if assets are edited or deleted later
- Snapshot.totalNetWorth is pre-calculated at snapshot time using exchange rates available at that moment
- Assets with isArchived=true are hidden from the main list but preserved in snapshots
