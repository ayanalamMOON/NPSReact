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
    return value !== null ? JSON.parse(value) : defaultSettings[key];
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
