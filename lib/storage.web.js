import AsyncStorage from '@react-native-async-storage/async-storage';

// Expo SQLite's web adapter requires cross-origin isolation headers. Keep the
// web build independent of that hosting constraint while native builds use SQLite.
export const Storage = AsyncStorage;
