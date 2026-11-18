import { Storage } from './storage';

export const defaultSettings = {
  colorScheme: 'System',
  showDlcsTab: true,
  selectedPlatforms: ['PSX', 'PSM', 'PS3', 'PSP', 'PSV'],
  serverUrl: 'https://nopaystation.com',
};

export const getSetting = async (key) => {
  try {
    const value = await Storage.getItem(key);
    if (value === null) return defaultSettings[key];

    const parsed = JSON.parse(value);

    // Existing installations persisted this built-in endpoint before HTTPS was enforced.
    if (key === 'serverUrl' && parsed === 'http://nopaystation.com') {
      await Storage.setItem(key, JSON.stringify(defaultSettings.serverUrl));
      return defaultSettings.serverUrl;
    }

    return parsed;
  } catch (error) {
    console.warn('Unable to read setting "' + key + '":', error);
    return defaultSettings[key];
  }
};

export const setSetting = async (key, value) => {
  try {
    await Storage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Unable to save setting "' + key + '":', error);
    throw error;
  }
};
