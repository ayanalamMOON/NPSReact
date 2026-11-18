import { Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import ReactNativeBlobUtil from 'react-native-blob-util';

function assertHttpsUrl(value) {
  let parsed;
  try {
    parsed = new URL(String(value || '').trim());
  } catch {
    throw new Error('The download URL is invalid.');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('Downloads must use HTTPS.');
  }
  return parsed.href;
}

export const isWeb = false;
export const isNative = true;

export const copyToClipboard = async (text) => {
  await Clipboard.setStringAsync(String(text));
};

export const triggerHapticFeedback = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};

export const downloadFile = async (url, filename) => {
  const safeUrl = assertHttpsUrl(url);
  const safeFilename = String(filename || 'download.pkg').replace(/[\\/:*?"<>|]/g, '_');
  const response = await ReactNativeBlobUtil.config({
    fileCache: true,
    timeout: 180000,
  }).fetch('GET', safeUrl);

  if (!response.ok) {
    const status = response.status;
    await response.flush().catch(() => {});
    throw new Error('Download failed (HTTP ' + status + ').');
  }

  const localPath = response.path();
  if (!localPath) {
    throw new Error('The downloaded file could not be saved to local storage.');
  }

  if (Platform.OS === 'android') {
    await ReactNativeBlobUtil.media.addDownload({
      title: safeFilename,
      description: 'Downloaded by NPSReact',
      mime: 'application/octet-stream',
      path: localPath,
      notification: true,
    });
    return { path: localPath, filename: safeFilename };
  }

  await ReactNativeBlobUtil.open.chooser(localPath, {
    mime: 'application/octet-stream',
    title: 'Save or open ' + safeFilename,
  });
  return { path: localPath, filename: safeFilename };
};

export const fetchData = async (url) => {
  const safeUrl = assertHttpsUrl(url);
  const response = await ReactNativeBlobUtil.fetch('GET', safeUrl);
  if (!response.ok) throw new Error('Request failed (HTTP ' + response.status + ').');
  return response.text();
};
