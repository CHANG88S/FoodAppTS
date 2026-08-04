# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FoodRater is a restaurant rating and review app built with Expo and Convex. Users can browse restaurants, rate individual menu items, share reviews, and engage socially through a tweet-style feed.

## Development Commands

```bash
# Start development server (opens with options for dev build, emulator, or Expo Go)
npm start
# or
npx expo start

# Platform-specific starts
npm run android    # Android emulator or device
npm run ios        # iOS simulator
npm run web        # Web browser

# Code quality
npm run lint       # ESLint

# Build with EAS (configured in eas.json)
eas build --platform ios --profile production
eas build --platform android --profile production
```

## Environment Setup

Required environment variables (set in `.env.local`):
- `EXPO_PUBLIC_CONVEX_URL` - Your Convex deployment URL

The app uses Expo Secure Store for client-side auth token storage.

## Architecture

### Tech Stack
- **Frontend**: Expo SDK ~53, React Native 0.79.6, React 19, TypeScript
- **Navigation**: Expo Router (file-based routing) with React Navigation
- **Backend**: Convex (database, auth, server functions)
- **Auth**: `@convex-dev/auth` with password provider
- **Styling**: React Native StyleSheet + `react-native-unistyles`
- **Icons**: `@expo/vector-icons` (Ionicons)

### Project Structure

```
foodraterts/
├── app/                    # Expo Router file-based routing
│   ├── index.tsx          # Auth/login gate (unauthenticated entry)
│   ├── _layout.tsx        # Root layout with Convex provider
│   ├── (tabs)/            # Tab navigation (authenticated area)
│   │   ├── _layout.tsx    # Tab bar + Drawer navigation wrapper
│   │   ├── home.tsx       # Main feed
│   │   ├── search.tsx     # Restaurant search
│   │   ├── notification.tsx
│   │   └── profile.tsx    # User profile
│   ├── restaurant/[id].tsx # Restaurant detail with modal sheet
│   ├── restaurant/[id]/add-item.tsx
│   ├── restaurant/rate/[itemId].tsx
│   ├── restaurant/post/[reviewId].tsx
│   ├── social/[tweetId].tsx
│   ├── badges.tsx
│   └── settings.tsx
├── convex/                # Convex backend
│   ├── schema.ts          # Database schema (see Data Model below)
│   ├── auth.config.ts     # Auth provider config
│   ├── auth.ts            # Auth server functions
│   ├── restaurants.ts     # Restaurant queries/mutations
│   ├── items.ts           # Menu item functions
│   ├── review.ts          # Review operations
│   ├── tweets.ts          # Social feed functions
│   ├── users.ts           # User operations
│   └── images.ts          # Image storage helpers
├── components/            # Reusable UI components
│   ├── CategoryButtons.tsx
│   ├── RatingMenu.tsx
│   └── ImageUploader.tsx
└── app.json              # Expo configuration
```

### Navigation Architecture

The app uses a nested navigation structure:

1. **Root Stack** (`app/_layout.tsx`): Wraps everything with ConvexAuthProvider
   - `index` - Login/signup screen (no header)
   - `(tabs)` - Main authenticated area (no header)
   - `restaurant/[id]` - Restaurant details (with styled header)

2. **Tab + Drawer Layout** (`app/(tabs)/_layout.tsx`):
   - Bottom tabs: Home, Search, Notification, Profile
   - Right-side drawer: Settings, Badges, Sign Out
   - Uses `@react-navigation/drawer` with custom drawer content

3. **Deep Routes**: Restaurant sub-rates, social posts, etc.

### Data Model (Convex Schema)

Located in `convex/schema.ts`:

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User profiles | `username`, `email`, `role`, `preferences`, `displayedBadge` |
| `restaurants` | Restaurant directory | `restaurantName`, `city`, `state`, `placeId` (Google Maps) |
| `menuItems` | Individual dishes/drinks | `itemName`, `restaurantId`, `category`, `price` |
| `itemReviews` | Granular item ratings | `itemId`, `userId`, `overallRating`, `granularAttributes`, `likes`, `comments` |
| `tweets` | Social feed posts | `body`, `userId`, `imageStorageId`, `likes`, `comments` |
| `restaurantVisits` | User check-ins | `userId`, `restaurantId`, `timestamp` |

**Authentication**: Uses `@convex-dev/auth` Password provider. User profile created on sign-up with default preferences (sweetness, iceLevel, milkBase, etc.).

### Convex Functions

- **Queries** (`convex/*.ts`): Fetch data with `useQuery()` hook
- **Mutations**: Modify data with `useMutation()` hook
- **Actions**: Server-side functions for complex operations

All functions are auto-typed via `convex/_generated` - import from there for type safety.

### Key Patterns

1. **Auth Flow**:
   - Unauthenticated users enter at `app/index.tsx`
   - Can sign up, login, or continue as guest
   - Authenticated users land on `app/(tabs)/home.tsx`
   - Sign out redirects back to index

2. **Data Fetching**:
   ```tsx
   import { useQuery } from "convex/react";
   import { api } from "../convex/_generated/api";

   const data = useQuery(api.restaurants.list, { city: "SF" });
   ```

3. **Mutations**:
   ```tsx
   import { useMutation } from "convex/react";

   const addReview = useMutation(api.reviews.create);
   await addReview({ itemId: "...", rating: 5 });
   ```

4. **File Upload**: Uses Convex storage with `generateUploadUrl()` + `fetch()`

### Styling Conventions

- Brand color: `#6c3b3b` (deep brown/red)
- Background: `#FAFAFA` (off-white)
- Components use `StyleSheet.create()` with consistent shadow/border-radius patterns
- Tab bar: white background, no labels, icon-only

### EAS Build Profiles

Configured in `eas.json`:
- `development`: Development client, internal distribution
- `preview`: Internal testing builds
- `production`: Auto-incrementing version, stores submission ready
