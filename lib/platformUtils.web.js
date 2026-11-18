import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

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

export const isWeb = true;
export const isNative = false;

export const copyToClipboard = async (text) => {
  await Clipboard.setStringAsync(String(text));
};

export const triggerHapticFeedback = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};

export const downloadFile = async (url, filename) => {
  const safeUrl = assertHttpsUrl(url);
  const response = await fetch(safeUrl);
  if (!response.ok) {
    throw new Error('Download failed (HTTP ' + response.status + ').');
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = String(filename || 'download.pkg').replace(/[\\/:*?"<>|]/g, '_');
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
};

export const fetchData = async (url) => {
  const response = await fetch(assertHttpsUrl(url));
  if (!response.ok) throw new Error('Request failed (HTTP ' + response.status + ').');
  return response.text();
};
