# 🐧 Penguins Diary

A simple and cute gratitude diary app for noting down appreciated moments.

## Features

- **Quick note adding** - Tap the + button, type, and save
- **Numbered list** - Notes are numbered chronologically (1, 2, 3...)
- **Optional date picker** - Defaults to today, tap calendar to change
- **View & delete** - Tap any note to view full text or delete it
- **Local storage** - All data stays on your device (SQLite)

## Screenshots

```
┌─────────────────────────┐
│ 🐧 Gratitude Diary      │
├─────────────────────────┤
│ 1. Morning coffee       │
│    Today                │
├─────────────────────────┤
│ 2. Call with mom        │
│    Yesterday            │
├─────────────────────────┤
│  ┌─ ─ ─ ─ ─ ─ ─ ─ ─┐   │
│  │  + Add gratitude │   │
│  └─ ─ ─ ─ ─ ─ ─ ─ ─┘   │
└─────────────────────────┘
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app on your phone (for testing)

### Installation

```bash
# Navigate to project
cd penguins-diary

# Install dependencies
npm install

# Start development server
npx expo start
```

### Running the App

After starting the dev server:

- **iOS Simulator**: Press `i`
- **Android Emulator**: Press `a`
- **Physical Device**: Scan QR code with Expo Go app

## Project Structure

```
penguins-diary/
├── app/
│   ├── _layout.tsx          # Root layout (fonts, SQLite, navigation)
│   ├── index.tsx            # Home screen (note list + add input)
│   └── note/
│       └── [id].tsx         # Note detail screen (view/delete)
├── components/
│   └── DatePickerModal.tsx  # Calendar picker modal
├── db/
│   ├── schema.ts            # SQLite table creation
│   └── queries.ts           # CRUD operations
├── constants/
│   └── theme.ts             # Color palette
├── hooks/
│   └── useNotes.ts          # Notes hook (optional)
└── global.css               # Tailwind imports
```

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Expo](https://expo.dev) | React Native framework |
| [Expo Router](https://docs.expo.dev/router/introduction/) | File-based navigation |
| [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) | Local database |
| [NativeWind](https://www.nativewind.dev/) | Tailwind CSS for React Native |
| [react-native-calendars](https://github.com/wix/react-native-calendars) | Date picker |

## Database Schema

```sql
CREATE TABLE notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  date TEXT NOT NULL,
  image_uri TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## Color Theme

Soft green palette:

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | `#6BBF8A` | Header, buttons, accents |
| Secondary | `#A8E6CF` | Light highlights |
| Background | `#F5FFF8` | Screen background |
| Text | `#2D5A3D` | Main text color |
| Border | `#D4E8DA` | Card borders |

## How to Use

1. **Add a note**: Tap `+ Add gratitude` at the bottom
2. **Type**: Write what you're grateful for
3. **Change date** (optional): Tap the calendar icon
4. **Save**: Tap the `Add` button
5. **View note**: Tap any note in the list
6. **Delete note**: Tap trash icon in note detail view

## Building for Production

```bash
# Build for iOS
npx expo build:ios

# Build for Android
npx expo build:android

# Or use EAS Build
npx eas build --platform all
```

## License

MIT

---

Made with 💚 and 🐧
# penguin-s-list
