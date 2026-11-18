import React, { useContext, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  Button, Dialog, IconButton, List, Portal, SegmentedButtons,
  Snackbar, Surface, Text, TextInput,
} from 'react-native-paper';
import { LibraryContext } from '../contexts/LibraryContext';
import CatalogueCard from '../components/CatalogueCard';
import { getItemKey } from '../lib/catalogueUtils';

export default function LibraryView({ onSelectItem }) {
  const {
    library, ready, isFavorite, toggleFavorite, createCollection,
    deleteCollection, removeFromCollection, clearRecent,
  } = useContext(LibraryContext);
  const [section, setSection] = useState('favorites');
  const [collectionId, setCollectionId] = useState(null);
  const [createVisible, setCreateVisible] = useState(false);
  const [collectionName, setCollectionName] = useState('');
  const [snackbar, setSnackbar] = useState('');

  const currentCollection = library.collections.find((collection) => collection.id === collectionId);
  const items = useMemo(() => {
    const ids = section === 'favorites'
      ? library.favorites
      : section === 'recent'
        ? library.recent
        : currentCollection ? currentCollection.itemIds || [] : [];
    return ids.map((id) => library.itemsById[id]).filter(Boolean);
  }, [section, library, currentCollection]);

  const createNewCollection = async () => {
    const name = collectionName.trim();
    if (!name) {
      setSnackbar('Enter a collection name.');
      return;
    }
    const duplicate = library.collections.some((collection) => collection.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      setSnackbar('A collection with that name already exists.');
      return;
    }
    await createCollection(name);
    setCollectionName('');
    setCreateVisible(false);
    setSnackbar('Collection created.');
  };

  const openItem = (item) => {
    if (onSelectItem) onSelectItem(item, item.__platform || 'PSV', item.__catalogueType || 'GAMES');
  };

  const renderItem = ({ item }) => (
    <CatalogueCard
      item={item}
      layout="list"
      favorite={isFavorite(item)}
      onPress={() => openItem(item)}
      onToggleFavorite={() => toggleFavorite(item)}
      onRemove={section === 'collection' ? () => removeFromCollection(collectionId, item) : undefined}
    />
  );

  if (!ready) return <View style={styles.center}><Text>Loading your library...</Text></View>;

  return (
    <Surface style={styles.container} elevation={0}>
      <View style={styles.header}>
        <View>
          <Text variant="titleLarge">Your library</Text>
          <Text variant="bodySmall" style={styles.muted}>Favorites, recently viewed and custom collections</Text>
        </View>
        <IconButton icon="folder-plus-outline" mode="contained-tonal" onPress={() => setCreateVisible(true)} accessibilityLabel="Create collection" />
      </View>

      {section === 'collection' && currentCollection ? (
        <View style={styles.collectionHeader}>
          <Button icon="arrow-left" onPress={() => { setSection('collections'); setCollectionId(null); }}>Collections</Button>
          <Text variant="titleMedium">{currentCollection.name}</Text>
          <Text variant="labelSmall">{items.length} items</Text>
        </View>
      ) : (
        <SegmentedButtons
          value={section}
          onValueChange={(value) => { setSection(value); setCollectionId(null); }}
          buttons={[
            { value: 'favorites', label: 'Favorites', icon: 'heart' },
            { value: 'recent', label: 'Recent', icon: 'history' },
            { value: 'collections', label: 'Collections', icon: 'folder-multiple' },
          ]}
          style={styles.sections}
        />
      )}

      {section === 'collections' ? (
        library.collections.length === 0 ? (
          <View style={styles.center}>
            <Text variant="titleMedium">No collections yet</Text>
            <Text style={styles.muted}>Create collections to organize games into your own groups.</Text>
            <Button mode="contained" icon="plus" onPress={() => setCreateVisible(true)}>Create collection</Button>
          </View>
        ) : (
          <FlatList
            data={library.collections}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.collectionList}
            renderItem={({ item }) => (
              <List.Item
                title={item.name}
                description={(item.itemIds || []).length + ' saved items'}
                left={(props) => <List.Icon {...props} icon="folder-outline" />}
                right={() => (
                  <IconButton
                    icon="delete-outline"
                    accessibilityLabel={'Delete ' + item.name}
                    onPress={() => {
                      deleteCollection(item.id);
                      setSnackbar('Collection deleted.');
                    }}
                  />
                )}
                onPress={() => { setCollectionId(item.id); setSection('collection'); }}
              />
            )}
          />
        )
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text variant="titleMedium">
            {section === 'favorites' ? 'No favorites yet' : section === 'recent' ? 'Nothing viewed yet' : 'This collection is empty'}
          </Text>
          <Text style={styles.muted}>
            {section === 'favorites'
              ? 'Tap the heart on a catalogue entry to save it here.'
              : section === 'recent'
                ? 'Open a game or DLC entry and it will appear here.'
                : 'Open an entry and use Add to collection to save it here.'}
          </Text>
        </View>
      ) : (
        <>
          {section === 'recent' ? (
            <View style={styles.recentActions}>
              <Text variant="labelMedium">{items.length} recently viewed</Text>
              <Button compact onPress={() => { clearRecent(); setSnackbar('Recently viewed history cleared.'); }}>Clear history</Button>
            </View>
          ) : null}
          <FlatList
            data={items}
            keyExtractor={(item) => getItemKey(item)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />
        </>
      )}

      <Portal>
        <Dialog visible={createVisible} onDismiss={() => setCreateVisible(false)}>
          <Dialog.Title>New collection</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Collection name"
              value={collectionName}
              onChangeText={setCollectionName}
              mode="outlined"
              autoFocus
              maxLength={40}
              onSubmitEditing={createNewCollection}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCreateVisible(false)}>Cancel</Button>
            <Button onPress={createNewCollection}>Create</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={2000}>{snackbar}</Snackbar>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 12, paddingTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  muted: { opacity: 0.65, textAlign: 'center', marginTop: 6 },
  sections: { marginBottom: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  listContent: { paddingBottom: 24, gap: 8 },
  collectionList: { paddingBottom: 24 },
  collectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  recentActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
