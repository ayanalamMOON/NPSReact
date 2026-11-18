import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getItemKey } from '../lib/catalogueUtils';

const STORAGE_KEY = 'npsreact:personal-library:v1';
const MAX_RECENT_ITEMS = 60;
const emptyLibrary = { favorites: [], recent: [], collections: [], itemsById: {} };

export const LibraryContext = createContext({
  ready: false,
  library: emptyLibrary,
  isFavorite: () => false,
  toggleFavorite: async () => {},
  recordRecent: async () => {},
  createCollection: async () => {},
  deleteCollection: async () => {},
  addToCollection: async () => {},
  removeFromCollection: async () => {},
  clearRecent: async () => {},
});

function sanitizeLibrary(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    favorites: Array.isArray(source.favorites) ? source.favorites : [],
    recent: Array.isArray(source.recent) ? source.recent : [],
    collections: Array.isArray(source.collections) ? source.collections : [],
    itemsById: source.itemsById && typeof source.itemsById === 'object' ? source.itemsById : {},
  };
}

export function LibraryProvider({ children }) {
  const [library, setLibrary] = useState(emptyLibrary);
  const [ready, setReady] = useState(false);
  const libraryRef = useRef(emptyLibrary);
  const readyRef = useRef(false);
  const loadPromiseRef = useRef(null);
  const writeQueueRef = useRef(Promise.resolve());

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = stored ? sanitizeLibrary(JSON.parse(stored)) : emptyLibrary;
        if (mounted) {
          libraryRef.current = parsed;
          setLibrary(parsed);
        }
      } catch (error) {
        console.warn('Unable to load personal library:', error);
      } finally {
        if (mounted) {
          readyRef.current = true;
          setReady(true);
        }
      }
    };
    loadPromiseRef.current = load();
    return () => { mounted = false; };
  }, []);

  const commit = useCallback(async (updater) => {
    // Wait for the first read before applying a mutation. This prevents an early
    // favorite/recent write from replacing data that has not finished hydrating.
    if (!readyRef.current && loadPromiseRef.current) await loadPromiseRef.current;

    const next = sanitizeLibrary(updater(libraryRef.current));
    libraryRef.current = next;
    setLibrary(next);

    // AsyncStorage writes are serialized so a slower earlier write cannot finish
    // after a newer write and leave stale state on disk.
    const write = writeQueueRef.current
      .catch(() => {})
      .then(() => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)));
    writeQueueRef.current = write;
    try {
      await write;
    } catch (error) {
      console.warn('Unable to persist personal library:', error);
    }
    return next;
  }, []);

  const isFavorite = useCallback((item) => library.favorites.includes(getItemKey(item)), [library.favorites]);

  const toggleFavorite = useCallback(async (item) => {
    const id = getItemKey(item);
    await commit((current) => ({
      ...current,
      favorites: current.favorites.includes(id)
        ? current.favorites.filter((entry) => entry !== id)
        : [id, ...current.favorites],
      itemsById: { ...current.itemsById, [id]: item },
    }));
  }, [commit]);

  const recordRecent = useCallback(async (item) => {
    const id = getItemKey(item);
    await commit((current) => ({
      ...current,
      recent: [id, ...current.recent.filter((entry) => entry !== id)].slice(0, MAX_RECENT_ITEMS),
      itemsById: { ...current.itemsById, [id]: item },
    }));
  }, [commit]);

  const createCollection = useCallback(async (name) => {
    const trimmed = String(name || '').trim();
    if (!trimmed) return null;
    const id = 'collection-' + Date.now().toString(36);
    await commit((current) => ({
      ...current,
      collections: [...current.collections, { id, name: trimmed, itemIds: [], createdAt: new Date().toISOString() }],
    }));
    return id;
  }, [commit]);

  const deleteCollection = useCallback(async (collectionId) => {
    await commit((current) => ({
      ...current,
      collections: current.collections.filter((collection) => collection.id !== collectionId),
    }));
  }, [commit]);

  const addToCollection = useCallback(async (collectionId, item) => {
    const id = getItemKey(item);
    await commit((current) => ({
      ...current,
      itemsById: { ...current.itemsById, [id]: item },
      collections: current.collections.map((collection) =>
        collection.id === collectionId
          ? { ...collection, itemIds: [...new Set([...(collection.itemIds || []), id])] }
          : collection
      ),
    }));
  }, [commit]);

  const removeFromCollection = useCallback(async (collectionId, item) => {
    const id = getItemKey(item);
    await commit((current) => ({
      ...current,
      collections: current.collections.map((collection) =>
        collection.id === collectionId
          ? { ...collection, itemIds: (collection.itemIds || []).filter((entry) => entry !== id) }
          : collection
      ),
    }));
  }, [commit]);

  const clearRecent = useCallback(async () => {
    await commit((current) => ({ ...current, recent: [] }));
  }, [commit]);

  return (
    <LibraryContext.Provider value={{
      ready, library, isFavorite, toggleFavorite, recordRecent,
      createCollection, deleteCollection, addToCollection, removeFromCollection, clearRecent,
    }}>
      {children}
    </LibraryContext.Provider>
  );
}
