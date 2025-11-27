# PWA Installation Guide

## Overview

GHETTO FINANCE is a Progressive Web App (PWA) that can be installed on any device - phones, tablets, or computers. When installed, it works just like a native app with offline capabilities and push notifications.

## Features

- **Offline Access**: Browse products and manage your account even without internet
- **Fast Loading**: Cached assets for instant load times
- **Native Feel**: Runs in full-screen mode without browser chrome
- **App Icon**: Beautiful animated G logo appears on your home screen
- **Push Notifications**: Stay updated on orders, messages, and auctions (coming soon)
- **Auto-Updates**: Always get the latest version automatically

## Installation Methods

### Android (Chrome, Edge, Samsung Internet)

1. Open GHETTO FINANCE in your browser
2. Look for the "Install App" button at the bottom of the page
3. Click it and approve the installation prompt
4. The app icon will appear on your home screen

**Alternative method:**
- Tap the menu (⋮) in your browser
- Select "Install app" or "Add to Home screen"

### iPhone/iPad (Safari only)

1. Open GHETTO FINANCE in Safari browser
2. Tap the Share button at the bottom (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" in the top right
5. The app icon will appear on your home screen

**Important:** iOS installation only works in Safari. If you're using Chrome or another browser, please open the site in Safari first.

### Desktop (Chrome, Edge, Brave)

1. Open GHETTO FINANCE in your browser
2. Look for the install icon in the address bar or click the "Install App" button
3. Click "Install" when prompted
4. The app will open in its own window

## App Icon

The app uses the signature GHETTO FINANCE "G" logo with:
- Animated rainbow gradient colors
- Glowing effect
- Black background with rounded corners
- Crisp vector graphics that scale perfectly on any device

## Technical Details

### Manifest Configuration

- **Name**: GHETTO FINANCE - Secure P2P Marketplace
- **Short Name**: GHETTO FINANCE
- **Display Mode**: Standalone (full-screen app experience)
- **Theme Color**: #FFFF00 (Neon Yellow)
- **Background Color**: #000000 (Black)
- **Orientation**: Portrait (mobile devices)

### Service Worker

The app includes a service worker that:
- Caches static assets for offline use
- Implements network-first strategy for dynamic content
- Automatically updates when new versions are available
- Provides background sync for messages (coming soon)

### Icon Sizes

The following icon sizes are available for optimal display across all devices:
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

### Browser Support

**Full PWA Support:**
- Chrome (Android, Desktop, ChromeOS)
- Edge (Android, Desktop, Windows)
- Samsung Internet (Android)
- Brave (Android, Desktop)
- Opera (Android, Desktop)

**Limited Support (Add to Home Screen only):**
- Safari (iOS, iPadOS, macOS)
- Firefox (Android - partial)

**Not Supported:**
- Internet Explorer
- Older browser versions (update to the latest version)

## Troubleshooting

### Install button not showing?

**Chrome/Android:**
- Make sure you're on HTTPS (secure connection)
- Clear browser cache and reload
- Check if the app is already installed
- Try desktop mode if on mobile

**iOS/Safari:**
- Verify you're using Safari (not Chrome or other browsers)
- Update to latest iOS version
- Follow manual installation steps above

### App not working offline?

- Visit a few pages while online first to cache them
- Check that service worker is registered (developer console)
- Clear app data and reinstall if issues persist

### Icons not appearing correctly?

- Clear browser cache
- Uninstall and reinstall the app
- Make sure you have a stable internet connection during installation

## Uninstallation

### Android
- Long-press the app icon
- Select "App info" or "Uninstall"
- Confirm uninstallation

### iOS
- Long-press the app icon
- Tap "Remove App"
- Select "Delete App"

### Desktop
- Right-click the app icon in your system tray/dock
- Select "Uninstall" or "Remove"
- Or go to browser settings > Apps > GHETTO FINANCE > Uninstall

## Privacy & Permissions

The PWA requests minimal permissions:
- **Storage**: To cache assets and data for offline use
- **Notifications**: (Optional) For order updates and messages
- **Location**: (Optional) For local pickup coordination

All data stays on your device. We never track usage without your consent.

## Updates

The app automatically checks for updates and downloads them in the background. When a new version is available:
1. You'll see a notification or toast message
2. Reload the app to get the latest version
3. Updates are typically seamless and instant

## Development

For developers wanting to test PWA functionality locally:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Testing PWA features:**
1. Build the production version
2. Serve it over HTTPS (required for service workers)
3. Use Chrome DevTools > Application tab to inspect PWA features
4. Test on real devices for accurate behavior

## Support

Having issues with installation? Contact us:
- Email: support@ghetto.finance
- GitHub Issues: [Report a problem]
- Live Chat: Available in the app after login

## Changelog

### Version 1.0.0 (Current)
- Initial PWA implementation
- Service worker with offline support
- Dynamic G logo app icon
- Install button with platform-specific instructions
- Auto-update functionality
- Manifest with app shortcuts
