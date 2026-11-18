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

export const downloadFile = async (url, filename, onProgress, onTask) => {
  const safeUrl = assertHttpsUrl(url);
  const safeFilename = String(filename || 'download.pkg')
    .replace(/[\\/:*?"<>|]/g, '_');

  if (Platform.OS === 'android') {
    // Android 10+ scoped storage is handled through the Downloads MediaStore
    // collection. The platform DownloadManager owns the transfer and its
    // persistent notification, so the app process need not remain alive.
    const task = ReactNativeBlobUtil.config({
      android: {
        downloadManager: {
          useDownloadManager: true,
          title: safeFilename,
          description: 'Downloaded by NPSReact',
          mime: 'application/octet-stream',
          mediaScannable: true,
          notification: true,
          storeInDownloads: true,
        },
      },
    }).fetch('GET', safeUrl);

    if (onTask) onTask(task);
    const response = await task;

    if (!response.ok) {
      throw new Error('Download failed (HTTP ' + response.status + ').');
    }

    return {
      path: response.path(),
      filename: safeFilename,
      managedBySystem: true,
    };
  }

  // iOS keeps the transfer in native code and presents the system document
  // chooser after completion, avoiding a large base64/JS memory copy.
  const task = ReactNativeBlobUtil.config({
    fileCache: true,
    timeout: 21600000,
    ios: { backgroundTask: true },
  }).fetch('GET', safeUrl);

  task.progress({ interval: 1000 }, (received, total) => {
    if (onProgress) {
      onProgress(received, total > 0 ? total : null);
    }
  });

  if (onTask) onTask(task);
  const response = await task;

  if (!response.ok) {
    throw new Error('Download failed (HTTP ' + response.status + ').');
  }

  const localPath = response.path();
  if (!localPath) {
    throw new Error('The downloaded file could not be saved to local storage.');
  }

  await ReactNativeBlobUtil.open.chooser(localPath, {
    mime: 'application/octet-stream',
    title: 'Save or open ' + safeFilename,
  });

  return { path: localPath, filename: safeFilename, managedBySystem: false };
};

export const fetchData = async (url) => {
  const safeUrl = assertHttpsUrl(url);
  const response = await ReactNativeBlobUtil.fetch('GET', safeUrl);
  if (!response.ok) {
    throw new Error('Request failed (HTTP ' + response.status + ').');
  }
  return response.text();
};
