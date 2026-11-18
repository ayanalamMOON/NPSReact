import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Card, Chip, IconButton, Text } from 'react-native-paper';
import { formatFileSize, getField, getItemName, getRegion, getTitleId } from '../lib/catalogueUtils';

export default function CatalogueCard({ item, layout, favorite, onPress, onToggleFavorite, onRemove }) {
  const isGrid = layout === 'grid';
  return (
    <Card
      mode="outlined"
      onPress={onPress}
      style={[styles.card, isGrid ? styles.gridCard : styles.listCard]}
      accessibilityRole="button"
      accessibilityLabel={'Open details for ' + getItemName(item)}
    >
      <Card.Title
        title={getItemName(item)}
        subtitle={getField(item, 'Original Name', 'Original name') || getTitleId(item) || getRegion(item)}
        titleNumberOfLines={2}
        subtitleNumberOfLines={1}
        right={(props) => (
          <IconButton
            {...props}
            icon={favorite ? 'heart' : 'heart-outline'}
            iconColor={favorite ? '#D32F6F' : undefined}
            onPress={onToggleFavorite}
            accessibilityLabel={favorite ? 'Remove from favorites' : 'Add to favorites'}
          />
        )}
      />
      <Card.Content>
        <View style={styles.chips}>
          <Chip compact>{getRegion(item)}</Chip>
          <Chip compact>{formatFileSize(getField(item, 'File Size'))}</Chip>
        </View>
        {getTitleId(item) ? <Text variant="bodySmall" style={styles.titleId}>{getTitleId(item)}</Text> : null}
        {getField(item, 'Last Modification Date') ? (
          <Text variant="labelSmall" style={styles.date}>Updated {getField(item, 'Last Modification Date')}</Text>
        ) : null}
      </Card.Content>
      {onRemove ? (
        <Card.Actions>
          <Button compact onPress={onRemove} icon="playlist-remove">Remove</Button>
          <Button compact onPress={onPress}>Details</Button>
        </Card.Actions>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 10 },
  gridCard: { flex: 1, marginHorizontal: 4, minWidth: 0 },
  listCard: { width: '100%' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  titleId: { opacity: 0.7, marginTop: 3 },
  date: { opacity: 0.6, marginTop: 3 },
});
