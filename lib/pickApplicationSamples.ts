import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export type PickedApplicationSample = {
  uri: string;
  name: string;
  mime: string;
  /** Captured at pick time — ImagePicker temp files are deleted before upload on Android. */
  base64?: string;
};

async function stabilizeAsset(
  asset: ImagePicker.ImagePickerAsset,
  index: number,
): Promise<PickedApplicationSample> {
  const mimeType = asset.mimeType ?? 'image/jpeg';
  const name = asset.fileName ?? `sample-${Date.now()}-${index}.jpg`;
  let uri = asset.uri;
  let base64 = asset.base64 ?? undefined;

  if (Platform.OS !== 'web' && FileSystem.cacheDirectory) {
    const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
    const dest = `${FileSystem.cacheDirectory}skillbee-sample-${Date.now()}-${index}.${ext}`;
    try {
      await FileSystem.copyAsync({ from: asset.uri, to: dest });
      uri = dest;
      if (!base64) {
        base64 = await FileSystem.readAsStringAsync(dest, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }
    } catch {
      /* fall back to picker uri / inline base64 */
    }
  }

  if (!base64 && Platform.OS !== 'web') {
    try {
      base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } catch {
      /* upload will read uri again */
    }
  }

  return { uri, name, mime: mimeType, base64 };
}

export async function pickApplicationSamples(maxCount: number): Promise<PickedApplicationSample[]> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    selectionLimit: maxCount,
    quality: 0.85,
    base64: true,
  });
  if (res.canceled || !res.assets?.length) return [];
  return Promise.all(res.assets.map((asset, index) => stabilizeAsset(asset, index)));
}

async function stabilizeDocument(
  asset: DocumentPicker.DocumentPickerAsset,
  index: number,
): Promise<PickedApplicationSample> {
  const mimeType = asset.mimeType ?? 'application/octet-stream';
  const name = asset.name ?? `sample-${Date.now()}-${index}`;
  let uri = asset.uri;
  let base64: string | undefined;

  if (Platform.OS !== 'web' && FileSystem.cacheDirectory) {
    const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';
    const dest = `${FileSystem.cacheDirectory}skillbee-doc-${Date.now()}-${index}${ext || '.bin'}`;
    try {
      await FileSystem.copyAsync({ from: asset.uri, to: dest });
      uri = dest;
      base64 = await FileSystem.readAsStringAsync(dest, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } catch {
      /* fall back to picker uri */
    }
  }

  return { uri, name, mime: mimeType, base64 };
}

export async function pickApplicationDocuments(maxCount: number): Promise<PickedApplicationSample[]> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    multiple: maxCount > 1,
    copyToCacheDirectory: true,
  });
  if (res.canceled || !res.assets?.length) return [];
  return Promise.all(res.assets.slice(0, maxCount).map((asset, index) => stabilizeDocument(asset, index)));
}
