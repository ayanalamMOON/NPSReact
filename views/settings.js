import React, { useState, useContext, useEffect } from 'react';
import { StyleSheet, Linking, ScrollView } from 'react-native';
import {
  Checkbox, Surface, SegmentedButtons, IconButton, Text, List, TextInput,
} from 'react-native-paper';
import { SettingsContext } from '../contexts/SettingsContext';

const SettingsView = ({ navigation }) => {
  const {
    showDlcsTab,
    selectedPlatforms,
    colorScheme,
    serverUrl,
    updateSetting,
  } = useContext(SettingsContext);

  const [localShowDlcsTab, setLocalShowDlcsTab] = useState(showDlcsTab);
  const [localSelectedPlatforms, setLocalSelectedPlatforms] = useState(selectedPlatforms);
  const [localTheme, setLocalTheme] = useState(colorScheme);
  const [localServerUrl, setLocalServerUrl] = useState(serverUrl);

  useEffect(() => {
    setLocalShowDlcsTab(showDlcsTab);
    setLocalSelectedPlatforms(selectedPlatforms);
    setLocalTheme(colorScheme);
    setLocalServerUrl(serverUrl);
  }, [showDlcsTab, selectedPlatforms, colorScheme, serverUrl]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      Promise.all([
        updateSetting('showDlcsTab', localShowDlcsTab),
        updateSetting('selectedPlatforms', localSelectedPlatforms),
        updateSetting('serverUrl', localServerUrl.trim()),
      ]).catch((error) => console.warn('Unable to save settings:', error));
    });

    return unsubscribe;
  }, [
    navigation,
    localShowDlcsTab,
    localSelectedPlatforms,
    localServerUrl,
    updateSetting,
  ]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Surface style={styles.surface}>
        <Text variant="labelLarge">Manage navigation</Text>
        <Checkbox.Item
          label="Show DLC's tab"
          status={localShowDlcsTab ? 'checked' : 'unchecked'}
          onPress={() => setLocalShowDlcsTab(!localShowDlcsTab)}
        />
      </Surface>

      <Surface style={styles.surface}>
        <Text variant="labelLarge">Select theme</Text>
        <List.Section>
          {[
            { value: 'Light', icon: 'white-balance-sunny' },
            { value: 'Dark', icon: 'brightness-3' },
            { value: 'System', icon: 'brightness-auto' },
          ].map((entry) => (
            <List.Item
              key={entry.value}
              title={entry.value}
              left={() => <List.Icon icon={entry.icon} />}
              right={() => localTheme === entry.value
                ? <List.Icon icon="check-circle-outline" />
                : null}
              rippleColor="transparent"
              onPress={() => {
                setLocalTheme(entry.value);
                updateSetting('colorScheme', entry.value).catch((error) => {
                  console.warn('Unable to save theme:', error);
                });
              }}
            />
          ))}
        </List.Section>
      </Surface>

      <Surface style={styles.surface}>
        <Text variant="labelLarge">Select platforms to display</Text>
        <SegmentedButtons
          value={localSelectedPlatforms}
          onValueChange={(value) => setLocalSelectedPlatforms(
            Array.isArray(value) ? value : [value]
          )}
          multiSelect
          buttons={[
            { value: 'PSV', label: 'PSV' },
            { value: 'PSM', label: 'PSM' },
            { value: 'PSX', label: 'PSX' },
            { value: 'PS3', label: 'PS3' },
            { value: 'PSP', label: 'PSP' },
          ]}
        />
      </Surface>

      <Surface style={styles.surface}>
        <Text variant="labelLarge">Server configuration</Text>
        <TextInput
          label="Server URL"
          value={localServerUrl}
          onChangeText={setLocalServerUrl}
          mode="outlined"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder="https://nopaystation.com"
          right={<TextInput.Icon icon="server" />}
        />
        <Text variant="bodySmall" style={styles.helper}>
          HTTPS is required. HTTP is accepted only for localhost development.
        </Text>
      </Surface>

      <IconButton
        icon="github"
        style={styles.github}
        mode="contained"
        accessibilityLabel="Open NPSReact GitHub repository"
        onPress={() => Linking.openURL('https://github.com/ayanalamMOON/NPSReact')}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    padding: 8,
    gap: 20,
    paddingBottom: 50,
  },
  surface: {
    padding: 16,
    borderRadius: 10,
    gap: 10,
  },
  helper: {
    opacity: 0.65,
  },
  github: {
    alignSelf: 'center',
  },
});

export default SettingsView;
