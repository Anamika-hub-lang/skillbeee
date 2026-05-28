import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export type PickedProfileImage = {
  uri: string;
  fileName: string;
  mimeType: string;
  /** Captured at pick time — ImagePicker temp files are deleted before submit. */
  base64?: string;
};

export async function pickProfileImage(): Promise<PickedProfileImage | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Photos', 'Allow access to choose a profile photo.');
    return null;
  }

  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.88,
    base64: true,
  });

  if (res.canceled || !res.assets[0]) return null;

  const asset = res.assets[0];
  const mimeType = asset.mimeType ?? 'image/jpeg';
  const fileName = asset.fileName ?? 'profile.jpg';
  let uri = asset.uri;
  let base64 = asset.base64 ?? undefined;

  if (Platform.OS !== 'web' && FileSystem.cacheDirectory) {
    const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
    const dest = `${FileSystem.cacheDirectory}skillbee-profile-${Date.now()}.${ext}`;
    try {
      await FileSystem.copyAsync({ from: asset.uri, to: dest });
      uri = dest;
      if (!base64) {
        base64 = await FileSystem.readAsStringAsync(dest, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }
    } catch {
      /* use picker uri + base64 if copy fails */
    }
  }

  return { uri, fileName, mimeType, base64 };
}
