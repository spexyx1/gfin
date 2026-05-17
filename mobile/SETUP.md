# GHETTO FINANCE Mobile App

Native iOS and Android app for the GHETTO FINANCE marketplace platform.

## Prerequisites

- Node.js 18+
- React Native CLI: `npm install -g @react-native-community/cli`
- For iOS: Xcode 15+, CocoaPods
- For Android: Android Studio, JDK 17, Android SDK 34

## Setup

1. Install dependencies:
```bash
cd mobile
npm install
```

2. Configure Supabase:
Edit `src/lib/supabase.ts` and replace the placeholder values with your actual Supabase project URL and anon key (same values as the web project's `.env` file).

3. iOS setup:
```bash
cd ios && pod install && cd ..
```

4. Run the app:
```bash
# Android
npm run android

# iOS
npm run ios
```

## Building for Release

### Android APK (for direct download from website)

```bash
cd android
./gradlew assembleRelease
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

Upload this APK to Supabase Storage or any file host, then add the download URL to the `app_releases` table via the Sitemaster dashboard.

### iOS (for TestFlight)

1. Open `ios/GhettoFinance.xcworkspace` in Xcode
2. Select "Any iOS Device" as build target
3. Product > Archive
4. Distribute to App Store Connect
5. In App Store Connect, add the build to TestFlight

## Architecture

- Connects to the same Supabase backend as the web app
- All data syncs in real-time between web and mobile
- Same authentication system (one account works everywhere)
- Real-time subscriptions for orders, messages, and products

## Project Structure

```
mobile/
  App.tsx                 - App entry point
  src/
    screens/             - All app screens
    components/          - Reusable UI components
    hooks/               - Data fetching hooks (mirrored from web)
    lib/                 - Supabase client
    navigation/          - React Navigation setup
    config/              - Theme, constants
    types/               - TypeScript type definitions
```
