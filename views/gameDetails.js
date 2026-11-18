import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, Platform } from 'react-native';
import {
  ActivityIndicator, Button, Card, Chip, Dialog, IconButton, List,
  Portal, ProgressBar, Snackbar, Text, useTheme,
} from 'react-native-paper';
import { SettingsContext } from '../contexts/SettingsContext';
import { LibraryContext } from '../contexts/LibraryContext';
import { fetchCatalogue } from '../lib/catalogueService';
import { copyToClipboard, downloadFile, isNative, triggerHapticFeedback } from '../lib/platformUtils';
import {
  findRelatedDlc, formatFileSize, getContentId, getField, getItemKey,
  getItemName, getRegion, getTitleId,
} from '../lib/catalogueUtils';

export default function GameDetailsView({ route, navigation }) {
  const { item, platform, type } = route.params;
  const { serverUrl } = useContext(SettingsContext);
  const {
    library, isFavorite, toggleFavorite, recordRecent, addToCollection, removeFromCollection,
  } = useContext(LibraryContext);
  const theme = useTheme();
  const [relatedDlc, setRelatedDlc] = useState([]);
  const [dlcLoading, setDlcLoading] = useState(false);
  const [dlcError, setDlcError] = useState('');
  const [collectionDialog, setCollectionDialog] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const downloadTaskRef = useRef(null);
  const favorite = isFavorite(item);

  useEffect(() => { recordRecent(item); }, [item, recordRecent]);

  const loadRelatedDlc = useCallback(async () => {
    if (type !== 'GAMES') return;
    if (!['PSV', 'PS3', 'PSP'].includes(platform)) {
      setRelatedDlc([]);
      setDlcError('');
      setDlcLoading(false);
      return;
    }
    setDlcLoading(true);
    setDlcError('');
    try {
      const result = await fetchCatalogue(platform, 'DLCS', serverUrl);
      setRelatedDlc(findRelatedDlc(result.rows, item));
    } catch (error) {
      setRelatedDlc([]);
      setDlcError(error.message || 'Related DLC could not be loaded.');
    } finally {
      setDlcLoading(false);
    }
  }, [item, platform, serverUrl, type]);

  useEffect(() => { loadRelatedDlc(); }, [loadRelatedDlc]);

  const collectionMembership = useMemo(() => {
    const key = getItemKey(item);
    return library.collections.reduce((result, collection) => {
      result[collection.id] = (collection.itemIds || []).includes(key);
      return result;
    }, {});
  }, [item, library.collections]);

  const download = async () => {
    const url = getField(item, 'PKG direct link');
    if (!url || url.toUpperCase() === 'MISSING') {
      setSnackbar('No package download link is available for this entry.');
      return;
    }

    setDownloading(true);
    setDownloadProgress(null);
    downloadTaskRef.current = null;
    try {
      triggerHapticFeedback();
      setSnackbar('Preparing package download...');
      const result = await downloadFile(
        url,
        getItemName(item).replace(/[\\/:*?"<>|]/g, '_') + '.pkg',
        (received, total) => {
          setDownloadProgress(total ? Math.max(0, Math.min(1, received / total)) : null);
        },
        (task) => {
          downloadTaskRef.current = task;
        }
      );

      setSnackbar(result.managedBySystem
        ? 'Download completed. Check Downloads/NPSReact.'
        : 'Download ready in the document chooser.');
    } catch (error) {
      if (error && error.code === 'ECANCELED') {
        setSnackbar('Download cancelled.');
      } else {
        setSnackbar(error.message || 'Download failed.');
      }
    } finally {
      downloadTaskRef.current = null;
      setDownloading(false);
      setDownloadProgress(null);
    }
  };

  const cancelDownload = async () => {
    try {
      if (downloadTaskRef.current && downloadTaskRef.current.cancel) {
        await downloadTaskRef.current.cancel();
      }
    } catch (error) {
      setSnackbar(error.message || 'Unable to cancel the download.');
    }
  };

  const copyLicense = async () => {
    const license = getField(item, 'zRIF', 'RAP');
    if (!license || license.toUpperCase() === 'MISSING') {
      setSnackbar('No license metadata is available.');
      return;
    }
    try {
      await copyToClipboard(license);
      triggerHapticFeedback();
      setSnackbar('License metadata copied to clipboard.');
    } catch (error) {
      setSnackbar('Unable to copy license metadata.');
    }
  };

  const toggleCollection = async (collection) => {
    const exists = !!collectionMembership[collection.id];
    if (exists) await removeFromCollection(collection.id, item);
    else await addToCollection(collection.id, item);
    setSnackbar(exists ? 'Removed from ' + collection.name : 'Added to ' + collection.name);
  };

  const metadata = [
    ['Platform', platform],
    ['Content type', type === 'DLCS' ? 'DLC' : 'Game'],
    ['Title ID', getTitleId(item)],
    ['Content ID', getContentId(item)],
    ['Region', getRegion(item)],
    ['Package size', formatFileSize(getField(item, 'File Size'))],
    ['Last modified', getField(item, 'Last Modification Date')],
    ['Required firmware', getField(item, 'Required FW', 'Required Firmware')],
    ['SHA-256', getField(item, 'SHA256', 'SHA-256')],
  ].filter((entry) => entry[1]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text variant="headlineSmall">{getItemName(item)}</Text>
            {getField(item, 'Original Name', 'Original name') ? (
              <Text variant="bodyMedium" style={styles.secondary}>{getField(item, 'Original Name', 'Original name')}</Text>
            ) : null}
            <View style={styles.chips}>
              <Chip compact>{platform}</Chip>
              <Chip compact>{type === 'DLCS' ? 'DLC' : 'Game'}</Chip>
              <Chip compact>{getRegion(item)}</Chip>
            </View>
          </View>
          <IconButton
            icon={favorite ? 'heart' : 'heart-outline'}
            iconColor={favorite ? '#D32F6F' : theme.colors.onSurface}
            size={28}
            onPress={() => { toggleFavorite(item); setSnackbar(favorite ? 'Removed from favorites' : 'Added to favorites'); }}
            accessibilityLabel={favorite ? 'Remove from favorites' : 'Add to favorites'}
          />
        </View>

        <Card mode="outlined" style={styles.card}>
          <Card.Title title="Package information" />
          <Card.Content>
            {metadata.map(([label, value]) => (
              <View key={label} style={styles.metadataRow}>
                <Text variant="labelMedium" style={styles.metadataLabel}>{label}</Text>
                <Text selectable variant="bodyMedium" style={styles.metadataValue}>{value}</Text>
              </View>
            ))}
          </Card.Content>
          <Card.Actions>
            <Button
              mode="contained"
              icon="download"
              onPress={download}
              loading={downloading}
              disabled={downloading || !getField(item, 'PKG direct link') || getField(item, 'PKG direct link').toUpperCase() === 'MISSING'}
            >
              {downloading ? 'Downloading' : 'Download'}
            </Button>
            {isNative && downloading ? (
              <Button compact mode="text" onPress={cancelDownload}>Cancel</Button>
            ) : null}
            <Button
              mode="outlined"
              icon="content-copy"
              onPress={copyLicense}
              disabled={!getField(item, 'zRIF', 'RAP') || getField(item, 'zRIF', 'RAP').toUpperCase() === 'MISSING'}
            >
              Copy license
            </Button>
          </Card.Actions>
          {downloading ? (
            <Card.Content>
              {downloadProgress === null ? (
                <Text variant="bodySmall" style={styles.secondary}>
                  {Platform.OS === 'android'
                    ? 'Android Download Manager is handling the transfer. Progress is available in the system notification.'
                    : 'Downloading package...'}
                </Text>
              ) : (
                <Text variant="bodySmall" style={styles.secondary}>
                  {Math.round(downloadProgress * 100)}% downloaded
                </Text>
              )}
              <ProgressBar
                indeterminate={downloadProgress === null}
                progress={downloadProgress || 0}
              />
            </Card.Content>
          ) : null}
        </Card>

        <Card mode="outlined" style={styles.card}>
          <Card.Title
            title="Your library"
            subtitle="Keep this entry organized in your personal collection"
            right={(props) => <IconButton {...props} icon="folder-plus-outline" onPress={() => setCollectionDialog(true)} />}
          />
          <Card.Content>
            {library.collections.length === 0 ? (
              <Text variant="bodyMedium" style={styles.secondary}>No collections yet. Create one from the Library tab.</Text>
            ) : library.collections.map((collection) => (
              <List.Item
                key={collection.id}
                title={collection.name}
                left={(props) => <List.Icon {...props} icon="folder-outline" />}
                right={() => (
                  <IconButton
                    icon={collectionMembership[collection.id] ? 'check-circle' : 'plus-circle-outline'}
                    onPress={() => toggleCollection(collection)}
                    accessibilityLabel={(collectionMembership[collection.id] ? 'Remove from ' : 'Add to ') + collection.name}
                  />
                )}
              />
            ))}
          </Card.Content>
        </Card>

        {type === 'GAMES' ? (
          <Card mode="outlined" style={styles.card}>
            <Card.Title title="Related DLC" subtitle="Matched using the catalogue Title ID" />
            <Card.Content>
              {dlcLoading ? (
                <View style={styles.inlineLoading}><ActivityIndicator /><Text style={styles.secondary}>Finding related DLC...</Text></View>
              ) : !['PSV', 'PS3', 'PSP'].includes(platform) ? (
                <Text variant="bodyMedium" style={styles.secondary}>No separate DLC catalogue is published for this platform.</Text>
              ) : dlcError ? (
                <View style={styles.inlineLoading}>
                  <Text style={styles.secondary}>{dlcError}</Text>
                  <Button compact onPress={loadRelatedDlc}>Retry</Button>
                </View>
              ) : relatedDlc.length === 0 ? (
                <Text variant="bodyMedium" style={styles.secondary}>No related DLC entries were found for this title in the current catalogue.</Text>
              ) : relatedDlc.map((dlc) => (
                <List.Item
                  key={getItemKey(dlc)}
                  title={getItemName(dlc)}
                  description={getRegion(dlc) + ' · ' + formatFileSize(getField(dlc, 'File Size'))}
                  left={(props) => <List.Icon {...props} icon="puzzle-outline" />}
                  right={(props) => <List.Icon {...props} icon="chevron-right" />}
                  onPress={() => navigation.push('GameDetails', { item: dlc, platform, type: 'DLCS' })}
                />
              ))}
            </Card.Content>
          </Card>
        ) : null}
      </ScrollView>

      <Portal>
        <Dialog visible={collectionDialog} onDismiss={() => setCollectionDialog(false)}>
          <Dialog.Title>Manage collections</Dialog.Title>
          <Dialog.Content>
            {library.collections.length === 0 ? (
              <Text>Create a collection from the Library tab first.</Text>
            ) : library.collections.map((collection) => (
              <List.Item
                key={collection.id}
                title={collection.name}
                onPress={() => toggleCollection(collection)}
                left={(props) => <List.Icon {...props} icon="folder-outline" />}
                right={() => (
                  <IconButton
                    icon={collectionMembership[collection.id] ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    onPress={() => toggleCollection(collection)}
                  />
                )}
              />
            ))}
          </Dialog.Content>
          <Dialog.Actions><Button onPress={() => setCollectionDialog(false)}>Done</Button></Dialog.Actions>
        </Dialog>
      </Portal>
      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={2400}>{snackbar}</Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 14, paddingBottom: 32, gap: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  titleBlock: { flex: 1, gap: 7 },
  secondary: { opacity: 0.68 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 3 },
  card: { marginBottom: 4 },
  metadataRow: { paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#88888855', gap: 3 },
  metadataLabel: { opacity: 0.65 },
  metadataValue: { flexShrink: 1 },
  inlineLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
});
