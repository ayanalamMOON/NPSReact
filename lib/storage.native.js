import SQLiteStorage from 'expo-sqlite/kv-store';
import LegacyAsyncStorage from '@react-native-async-storage/async-storage';

const MIGRATION_MARKER = 'npsreact:storage:migrated:sqlite-v1';
const LEGACY_KEYS = new Set([
  'showDlcsTab',
  'colorScheme',
  'selectedPlatforms',
  'serverUrl',
  'npsreact:personal-library:v1',
]);

let migrationPromise = null;
let legacyFallback = false;

async function migrateLegacyStorage() {
  const migrated = await SQLiteStorage.getItem(MIGRATION_MARKER);
  if (migrated === '1') return;

  const existingKeys = await LegacyAsyncStorage.getAllKeys();
  const keysToMigrate = existingKeys.filter((key) => LEGACY_KEYS.has(key));
  const entries = await LegacyAsyncStorage.multiGet(keysToMigrate);

  for (const [key, value] of entries) {
    if (value === null) continue;
    const existing = await SQLiteStorage.getItem(key);
    if (existing === null) {
      await SQLiteStorage.setItem(key, value);
    }
  }

  await SQLiteStorage.setItem(MIGRATION_MARKER, '1');
}

async function ensureMigration() {
  if (!migrationPromise) {
    migrationPromise = migrateLegacyStorage().catch((error) => {
      migrationPromise = null;
      legacyFallback = true;
      console.warn('SQLite storage migration failed; using legacy storage for this session:', error);
    });
  }
  await migrationPromise;
}

export const Storage = {
  async getItem(key) {
    await ensureMigration();
    return legacyFallback
      ? LegacyAsyncStorage.getItem(key)
      : SQLiteStorage.getItem(key);
  },

  async setItem(key, value) {
    await ensureMigration();
    return legacyFallback
      ? LegacyAsyncStorage.setItem(key, value)
      : SQLiteStorage.setItem(key, value);
  },

  async removeItem(key) {
    await ensureMigration();
    return legacyFallback
      ? LegacyAsyncStorage.removeItem(key)
      : SQLiteStorage.removeItem(key);
  },
};
