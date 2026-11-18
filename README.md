[![Android Build](https://github.com/ayanalamMOON/NPSReact/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/ayanalamMOON/NPSReact/actions/workflows/build.yml)

# NPSReact

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
- Keep favorites, history, collection membership and saved entry metadata on-device using AsyncStorage.

## Catalogue and storage behavior

The app reads the upstream TSV catalogue and keeps personal library data locally. The personal library does not require an account or a project-owned backend. The catalogue itself is refreshed from the configured TSV server.

Favorites, recently viewed entries and custom collections are stored under a versioned AsyncStorage key. Removing an entry from a collection does not remove it from favorites or recent history.

## Platform support

- PSV
- PSM
- PSX
- PS3
- PSP

Available platforms can be configured in Settings. Games and DLC catalogues are shown separately.

## Tech stack

- React Native / Expo
- React Native Paper (Material 3)
- React Navigation
- AsyncStorage
- PapaParse for TSV parsing
- react-native-blob-util for Android downloads

## Android CI/CD

GitHub Actions builds the Android app on pushes to `main`, pull requests targeting `main`, and manual workflow dispatches.

The workflow runs dependency installation, Expo configuration validation, an Expo Doctor diagnostic, Android JavaScript bundling, a clean Expo Prebuild, and Gradle compilation of both debug and release APKs.

### Download a build

1. Open the repository's **Actions** tab.
2. Select **NPSReact Android CI/CD**.
3. Open the latest successful **Build Android APKs** run.
4. Download the `npsreact-android-<commit-sha>` artifact.
5. Install `app-debug.apk` for development testing or `app-release.apk` for direct device testing.

Each build also includes SHA-256 checksums and build metadata. Artifacts are retained for 30 days.

### Publish a GitHub Release

Push a version tag such as `v1.3.0`. GitHub Actions will build the APKs and publish them with generated release notes.

**Signing note:** The generated release APK uses the native project's default signing configuration. It is suitable for direct installation/testing, but production distribution through Google Play and seamless updates across releases require a persistent Android upload keystore configured in the project.

## Development

Install dependencies with npm install, then run npm start or npm run android.

## Piracy disclaimer

This application is **not affiliated with, endorsed by, or connected to NoPayStation** or any of its contributors.

This app is designed solely as a convenient browser tool to access publicly available metadata. It does not host, distribute, or promote pirated content. Users are responsible for ensuring that their use of any content complies with applicable law and the rights of the relevant copyright holders.

## About the code

The application uses React Native with react-native-paper, allowing the interface to follow Material 3 design conventions. Personal library data is persisted locally on the device.
