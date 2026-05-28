import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function extFromMimeOrName(mimeType: string, filename?: string): string {
  if (filename?.includes('.')) {
    const ext = filename.slice(filename.lastIndexOf('.') + 1).toLowerCase();
    if (ext && ext.length <= 8) return ext;
  }
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('webp')) return 'webp';
  if (mimeType.includes('gif')) return 'gif';
  if (mimeType.includes('heic')) return 'heic';
  if (mimeType.includes('heif')) return 'heif';
  if (mimeType.includes('wordprocessingml')) return 'docx';
  if (mimeType.includes('msword')) return 'doc';
  return 'jpg';
}

/** Copy `content://` / `ph://` picker URIs into cache so they can be read on Android. */
async function resolveReadableUri(uri: string, mimeType: string, filename?: string): Promise<string> {
  if (Platform.OS === 'web' || uri.startsWith('file://') || uri.startsWith('data:')) {
    return uri;
  }
  if (!FileSystem.cacheDirectory) {
    return uri;
  }
  const ext = extFromMimeOrName(mimeType, filename);
  const dest = `${FileSystem.cacheDirectory}skillbee-upload-${Date.now()}.${ext}`;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

export async function readUriAsUint8Array(
  uri: string,
  mimeType = 'image/jpeg',
  filename?: string,
): Promise<Uint8Array> {
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    if (!res.ok) {
      throw new Error('Could not read the selected file.');
    }
    return new Uint8Array(await res.arrayBuffer());
  }

  const readUri = await resolveReadableUri(uri, mimeType, filename);
  const base64 = await FileSystem.readAsStringAsync(readUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return base64ToUint8Array(base64);
}

/** Reads a local picker URI into bytes for Supabase Storage upload. */
export async function readUriAsBlob(uri: string, mimeType = 'image/jpeg'): Promise<Blob> {
  const bytes = await readUriAsUint8Array(uri, mimeType);
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Blob([buffer], { type: mimeType });
}
