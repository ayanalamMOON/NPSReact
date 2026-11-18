[![Android Build](https://github.com/100Daisy/NPSReact/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/100Daisy/NPSReact/actions/workflows/build.yml)

# NPSReact

Created with React Native and React Native Paper, featuring Material You design.

NPSReact is a catalogue browser for publicly available NoPayStation metadata. It helps users discover, search, filter and organize catalogue entries on Android and the web.

## Game discovery and personal library

- Search game and DLC names, original names, title IDs, content IDs and regions.
- Filter catalogue entries by region, content type and package-link availability.
- Sort by name, package size, modification date and region.
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

## Development

Install dependencies with npm install, then run npm start or npm run android.

## Piracy disclaimer

This application is **not affiliated with, endorsed by, or connected to NoPayStation** or any of its contributors.

This app is designed solely as a convenient browser tool to access publicly available metadata. It does not host, distribute, or promote pirated content. Users are responsible for ensuring that their use of any content complies with applicable law and the rights of the relevant copyright holders.

## About the code

The application uses React Native with react-native-paper, allowing the interface to follow Material 3 design conventions. Personal library data is persisted locally on the device.
