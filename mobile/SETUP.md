# GHETTO FINANCE Mobile App — Setup Guide

## Prerequisites

Install these tools on your local machine before starting:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18+ | https://nodejs.org |
| React Native CLI | latest | `npm install -g @react-native-community/cli` |
| JDK | 17 | https://adoptium.net |
| Android Studio | latest | https://developer.android.com/studio |
| Watchman (macOS) | latest | `brew install watchman` |
| Xcode (iOS, Mac only) | 15+ | App Store |
| CocoaPods (iOS, Mac only) | latest | `brew install cocoapods` |

---

## Step 1 — Install JS Dependencies

```bash
cd mobile
npm install
```

---

## Step 2 — Android Setup

### Configure Android Studio
1. Open Android Studio
2. Go to **SDK Manager** → install Android SDK 34
3. Go to **AVD Manager** → create a Pixel 7 emulator (API 34)
4. Ensure `ANDROID_HOME` is set in your shell profile:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

### Run on emulator or device
```bash
npm run android
```

### Build release APK for distribution
```bash
cd android
./gradlew assembleRelease
```
APK location: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

To sign the APK for distribution:
```bash
# 1. Generate a keystore (do this once and keep it safe)
keytool -genkey -v -keystore ghetto-finance.keystore -alias ghetto-finance -keyalg RSA -keysize 2048 -validity 10000

# 2. Sign the APK
zipalign -v 4 app-release-unsigned.apk app-release-aligned.apk
apksigner sign --ks ghetto-finance.keystore --out app-release-signed.apk app-release-aligned.apk
```

---

## Step 3 — iOS Setup (Mac only)

### Install pods
```bash
cd ios && pod install && cd ..
```

### Run on simulator or device
```bash
npm run ios
```

### Build for TestFlight
1. Open `ios/GhettoFinance.xcworkspace` in Xcode
2. Select your team in **Signing & Capabilities**
3. Set bundle ID to `com.ghettofinance` (or your registered ID)
4. Choose **Any iOS Device** as build target
5. **Product → Archive**
6. In the Organizer, click **Distribute App → App Store Connect → Upload**
7. Go to App Store Connect → TestFlight → Add your APK to a beta group
8. Share the TestFlight invite link on the `/download` page

---

## Step 4 — Publish to Download Page

Once you have a signed APK or TestFlight link, insert a record in the `app_releases` Supabase table. The `/download` page on ghetto.finance will automatically show it.

Example SQL (run from Supabase dashboard or ask Claude Code):
```sql
INSERT INTO app_releases (platform, version, download_url, changelog, file_size_mb, min_os_version, is_latest)
VALUES (
  'android',
  '1.0.0-beta',
  'https://your-download-url/ghetto-finance-1.0.0.apk',
  'Initial beta release. Full marketplace, messaging, wallet, and social features.',
  45,
  '8.0',
  true
);
```

---

## Architecture

- Same Supabase backend as the web app (credentials pre-configured)
- Real-time sync for orders, messages, and products
- One account works across web and mobile
- Deep links: `ghettofinance://` and `https://ghetto.finance`
