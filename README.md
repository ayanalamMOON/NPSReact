# NPSReact

[![Android Build](https://github.com/ayanalamMOON/NPSReact/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/ayanalamMOON/NPSReact/actions/workflows/build.yml)

Created with React Native and React Native Paper, featuring Material You design.

NPSReact is a catalogue browser for publicly available NoPayStation metadata. It helps users discover, search, filter and organize catalogue entries on Android and the web.

## Game discovery and personal library

- Search game and DLC names, original names, title IDs, content IDs and regions.
- Filter catalogue entries by region, content type and package-link availability.
- Sort by name, title ID, region, package size and modification date.
- Switch between list and two-column grid layouts.
- Open a dedicated details screen with package metadata and available actions.
- Find related DLC by matching the catalogue Title ID.
- Save favorites and view recently opened entries.
- Create named collections and add or remove catalogue entries.
- Keep favorites, history, collection membership and saved entry metadata on-device.

## Offline catalogue and storage

- Catalogue snapshots are persisted locally and are displayed immediately on the next visit.
- NPSReact revalidates cached TSV catalogues with ETag and Last-Modified headers.
- When the network is unavailable, the latest saved catalogue remains searchable and filterable.
- Native settings, favourites, recent history, collections and catalogue cache use the SQLite-backed Expo KV store. Previously saved `http://nopaystation.com` settings are upgraded automatically to the HTTPS endpoint.
- Existing AsyncStorage settings and personal-library data are migrated on first launch after upgrading. The browser build continues to use the web-compatible AsyncStorage implementation.
- Cache entries are keyed by platform and catalogue type. Refresh the screen with pull-to-refresh to request the latest upstream data.

## Platform support

- PSV
- PSM
- PSX
- PS3
- PSP

Available platforms can be configured in Settings. Games and DLC catalogues are shown separately. Separate DLC catalogues are available for PSV, PS3 and PSP.

## Tech stack

- Expo SDK 58
- React 19.3 and React Native 0.88
- React Native Paper (Material 3)
- React Navigation 7
- Expo SQLite KV Store for native persistence
- Expo Splash Screen config plugin for native launch-screen configuration
- AsyncStorage for browser persistence and one-time legacy-data migration
- PapaParse for TSV parsing
- react-native-blob-util 1.x for native file transfers, Android's system DownloadManager/Downloads collection, and iOS document sharing
- Expo Clipboard and Expo Haptics

## Network and download security

The default catalogue endpoint uses HTTPS. Custom catalogue servers must use HTTPS, except for localhost development endpoints. Package downloads are also restricted to HTTPS. The app does not enable Android cleartext traffic globally.

## Android CI/CD

GitHub Actions builds the Android app on pushes to `main`, pull requests targeting `main`, version tags, and manual workflow dispatches.

The workflow resolves the exact SDK-compatible dependency graph, generates a lockfile from the manifest, validates dependencies with Expo Doctor, exports Android and web bundles, generates a clean Android native project, and compiles a debug APK, release APK and Android App Bundle. After a successful same-repository pull-request build, a separate, isolated job commits the generated package-lock.json back to the PR branch. The build job itself remains read-only; forked pull requests do not receive write permissions.

### Download a build

1. Open the repository's **Actions** tab.
2. Select **NPSReact Android CI/CD**.
3. Open a successful **Validate and build Android** run.
4. Download the `npsreact-android-<commit-sha>` artifact.
5. Install `app-debug.apk` for development testing or `app-release.apk` for direct device testing.

Each build includes an Android App Bundle, SHA-256 checksums and build metadata. Artifacts are retained for 30 days.

### Publish a GitHub Release

Push a version tag such as `v1.4.0`. GitHub Actions will build the APKs and AAB, then publish them with generated release notes.

**Signing note:** The generated release APK and AAB use the native project's default signing configuration. They are suitable for testing, not Google Play distribution. Configure a persistent Android upload keystore and matching GitHub Actions secrets before production publishing or seamless in-place app updates.

## Development

Install dependencies with `npm install`, then run `npm start`. Use `npm run android` for a local Android development build or `npm run web` for the browser build. Run `npm run doctor` and `npm run check:expo` before submitting dependency changes.

## Piracy disclaimer

This application is **not affiliated with, endorsed by, or connected to NoPayStation** or any of its contributors.

This app is designed solely as a convenient browser tool to access publicly available metadata. It does not host, distribute, or promote pirated content. Users are responsible for ensuring that their use of any content complies with applicable law and the rights of the relevant copyright holders.

## About the code

The application uses React Native with react-native-paper, allowing the interface to follow Material 3 design conventions. Personal library data and cached catalogue snapshots are persisted locally.
