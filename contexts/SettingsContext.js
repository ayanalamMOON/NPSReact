import React, { createContext, useCallback, useEffect, useState } from 'react';
import { getSetting, setSetting, defaultSettings } from '../lib/settingsManager';

export const SettingsContext = createContext({
  ready: false,
  showDlcsTab: defaultSettings.showDlcsTab,
  colorScheme: defaultSettings.colorScheme,
  selectedPlatforms: defaultSettings.selectedPlatforms,
  serverUrl: defaultSettings.serverUrl,
  updateSetting: async () => {},
});

export const SettingsProvider = ({ children }) => {
  const [showDlcsTab, setShowDlcsTab] = useState(defaultSettings.showDlcsTab);
  const [colorScheme, setColorScheme] = useState(defaultSettings.colorScheme);
  const [selectedPlatforms, setSelectedPlatforms] = useState(defaultSettings.selectedPlatforms);
  const [serverUrl, setServerUrl] = useState(defaultSettings.serverUrl);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      try {
        const [storedShowDlcsTab, storedColorScheme, storedSelectedPlatforms, storedServerUrl] =
          await Promise.all([
            getSetting('showDlcsTab'),
            getSetting('colorScheme'),
            getSetting('selectedPlatforms'),
            getSetting('serverUrl'),
          ]);

        if (!mounted) return;
        setShowDlcsTab(storedShowDlcsTab);
        setColorScheme(storedColorScheme);
        setSelectedPlatforms(
          Array.isArray(storedSelectedPlatforms) && storedSelectedPlatforms.length
            ? storedSelectedPlatforms
            : defaultSettings.selectedPlatforms
        );
        setServerUrl(storedServerUrl || defaultSettings.serverUrl);
      } catch (error) {
        console.warn('Unable to load settings:', error);
      } finally {
        if (mounted) setReady(true);
      }
    };

    loadSettings();
    return () => {
      mounted = false;
    };
  }, []);

  const updateSetting = useCallback(async (key, value) => {
    if (key === 'showDlcsTab') setShowDlcsTab(value);
    if (key === 'colorScheme') setColorScheme(value);
    if (key === 'selectedPlatforms') setSelectedPlatforms(value);
    if (key === 'serverUrl') setServerUrl(value);
    await setSetting(key, value);
  }, []);

  return (
    <SettingsContext.Provider value={{
      ready,
      showDlcsTab,
      colorScheme,
      selectedPlatforms,
      serverUrl,
      updateSetting,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
