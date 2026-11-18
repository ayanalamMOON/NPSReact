import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator, Button, Dialog, Divider, IconButton, Portal,
  RadioButton, Searchbar, SegmentedButtons, Snackbar, Surface, Text,
} from 'react-native-paper';
import { SettingsContext } from '../contexts/SettingsContext';
import { LibraryContext } from '../contexts/LibraryContext';
import CatalogueCard from '../components/CatalogueCard';
import { fetchCatalogue } from '../lib/catalogueService';
import {
  filterCatalogue, getDistinctRegions, getItemKey, sortCatalogue,
  SORT_OPTIONS, SUPPORTED_PLATFORMS,
} from '../lib/catalogueUtils';

export default function ReaderView({ route, type, onSelectItem }) {
  const catalogueType = type || route?.params?.type || 'GAMES';
  const { selectedPlatforms, serverUrl } = useContext(SettingsContext);
  const { isFavorite, toggleFavorite } = useContext(LibraryContext);
  const availablePlatforms = useMemo(() => {
    const selected = Array.isArray(selectedPlatforms) ? selectedPlatforms : [];
    const enabled = SUPPORTED_PLATFORMS.filter((platform) =>
      selected.length === 0 || selected.includes(platform.value)
    );
    return enabled.length ? enabled : SUPPORTED_PLATFORMS;
  }, [selectedPlatforms]);

  const [platform, setPlatform] = useState(
    availablePlatforms[0] ? availablePlatforms[0].value : 'PSV'
  );
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [region, setRegion] = useState('All');
  const [contentType, setContentType] = useState('All');
  const [availability, setAvailability] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [layout, setLayout] = useState('list');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!availablePlatforms.some((entry) => entry.value === platform)) {
      setPlatform(availablePlatforms[0].value);
    }
  }, [availablePlatforms, platform]);

  const loadCatalogue = useCallback(async (isRefresh) => {
    const requestId = ++requestIdRef.current;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    if (catalogueType === 'DLCS' && !['PSV', 'PS3', 'PSP'].includes(platform)) {
      setData([]);
      setError('unsupported:' + platform);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const rows = await fetchCatalogue(platform, catalogueType, serverUrl);
      if (requestId === requestIdRef.current) setData(rows);
    } catch (loadError) {
      if (requestId === requestIdRef.current) {
        setError(loadError.message || 'Unable to load the catalogue.');
        setData([]);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [platform, catalogueType, serverUrl]);

  useEffect(() => {
    loadCatalogue(false);
    return () => { requestIdRef.current += 1; };
  }, [loadCatalogue]);

  useEffect(() => {
    setRegion('All');
    setContentType('All');
    setAvailability('all');
  }, [platform, catalogueType]);

  const regions = useMemo(() => getDistinctRegions(data), [data]);
  const filteredItems = useMemo(() => {
    const filtered = filterCatalogue(data, {
      query: searchQuery, region, contentType, downloadAvailability: availability,
    });
    return sortCatalogue(filtered, sortBy);
  }, [data, searchQuery, region, contentType, availability, sortBy]);

  const openItem = (item) => {
    if (onSelectItem) onSelectItem(item, platform, catalogueType);
  };

  const renderItem = ({ item }) => (
    <CatalogueCard
      item={item}
      layout={layout}
      favorite={isFavorite(item)}
      onPress={() => openItem(item)}
      onToggleFavorite={() => {
        const wasFavorite = isFavorite(item);
        toggleFavorite(item);
        setSnackbar(wasFavorite ? 'Removed from favorites' : 'Added to favorites');
      }}
    />
  );

  const clearFilters = () => {
    setRegion('All');
    setContentType('All');
    setAvailability('all');
    setSortBy('name-asc');
  };

  return (
    <Surface style={styles.container} elevation={0}>
      <Searchbar
        placeholder="Search name, title ID, content ID, region..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.search}
        loading={loading}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.platforms}>
        <SegmentedButtons value={platform} onValueChange={setPlatform} buttons={availablePlatforms} style={styles.platformButtons} />
      </ScrollView>

      <View style={styles.toolbar}>
        <View style={styles.toolbarActions}>
          <Button mode="outlined" icon="filter-variant" compact onPress={() => setFiltersVisible(true)}>Filters</Button>
          <Button mode="outlined" icon="sort" compact onPress={() => setSortVisible(true)}>Sort</Button>
        </View>
        <View style={styles.toolbarActions}>
          <IconButton icon="view-list" mode={layout === 'list' ? 'contained-tonal' : 'outlined'} onPress={() => setLayout('list')} accessibilityLabel="List view" />
          <IconButton icon="view-grid" mode={layout === 'grid' ? 'contained-tonal' : 'outlined'} onPress={() => setLayout('grid')} accessibilityLabel="Grid view" />
        </View>
      </View>

      <View style={styles.resultSummary}>
        <Text variant="labelMedium">{filteredItems.length.toLocaleString()} results</Text>
        {(region !== 'All' || availability !== 'all' || contentType !== 'All') ? (
          <Button compact onPress={clearFilters}>Clear filters</Button>
        ) : null}
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.muted}>Loading {catalogueType.toLowerCase()} catalogue...</Text>
        </View>
      ) : error.startsWith('unsupported:') ? (
        <View style={styles.center}>
          <Text variant="titleMedium">No DLC catalogue for this platform</Text>
          <Text style={styles.muted}>No separate DLC TSV is published for {error.replace('unsupported:', '')}. Choose PSV, PSP or PS3.</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text variant="titleMedium">Catalogue unavailable</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={() => loadCatalogue(false)}>Retry</Button>
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.center}>
          <Text variant="titleMedium">No matching entries</Text>
          <Text style={styles.muted}>Try a different query or clear your filters.</Text>
          <Button onPress={() => { setSearchQuery(''); clearFilters(); }}>Reset search and filters</Button>
        </View>
      ) : (
        <FlatList
          key={layout}
          data={filteredItems}
          keyExtractor={(item) => getItemKey(item)}
          renderItem={renderItem}
          numColumns={layout === 'grid' ? 2 : 1}
          columnWrapperStyle={layout === 'grid' ? styles.gridRow : undefined}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadCatalogue(true)} />}
          initialNumToRender={12}
          windowSize={7}
        />
      )}

      <Portal>
        <Dialog visible={filtersVisible} onDismiss={() => setFiltersVisible(false)}>
          <Dialog.Title>Filter catalogue</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView contentContainerStyle={styles.dialogContent}>
              <Text variant="titleSmall">Region</Text>
              <RadioButton.Group onValueChange={setRegion} value={region}>
                <RadioButton.Item label="All regions" value="All" />
                {regions.map((entry) => <RadioButton.Item key={entry} label={entry} value={entry} />)}
              </RadioButton.Group>
              <Divider />
              <Text variant="titleSmall">Content type</Text>
              <SegmentedButtons
                value={contentType}
                onValueChange={setContentType}
                buttons={[
                  { value: 'All', label: 'All' },
                  { value: 'GAMES', label: 'Games' },
                  { value: 'DLCS', label: 'DLCs' },
                ]}
              />
              <Divider />
              <Text variant="titleSmall">Package availability</Text>
              <RadioButton.Group onValueChange={setAvailability} value={availability}>
                <RadioButton.Item label="All entries" value="all" />
                <RadioButton.Item label="Download link available" value="available" />
                <RadioButton.Item label="Missing download link" value="missing" />
              </RadioButton.Group>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={clearFilters}>Reset</Button>
            <Button onPress={() => setFiltersVisible(false)}>Done</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={sortVisible} onDismiss={() => setSortVisible(false)}>
          <Dialog.Title>Sort entries</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <RadioButton.Group onValueChange={setSortBy} value={sortBy}>
                {SORT_OPTIONS.map((option) => <RadioButton.Item key={option.value} label={option.label} value={option.value} />)}
              </RadioButton.Group>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions><Button onPress={() => setSortVisible(false)}>Done</Button></Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={1800}>{snackbar}</Snackbar>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 10, paddingTop: 8 },
  search: { marginBottom: 8 },
  platforms: { paddingVertical: 4 },
  platformButtons: { alignSelf: 'flex-start' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  toolbarActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resultSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 34 },
  listContent: { paddingTop: 6, paddingBottom: 24 },
  gridRow: { gap: 4, alignItems: 'stretch' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  muted: { opacity: 0.65, textAlign: 'center' },
  errorText: { textAlign: 'center', color: '#B3261E' },
  dialogContent: { paddingVertical: 8, gap: 8 },
});
