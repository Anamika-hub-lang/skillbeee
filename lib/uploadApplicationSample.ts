import { base64ToUint8Array, readUriAsUint8Array } from '@/lib/storage/uriToUploadBody';
import { supabase } from '@/lib/supabase';

function randomObjectName(filename: string): string {
  const ext = filename.includes('.') ? filename.slice(filename.lastIndexOf('.')) : '.jpg';
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
}

/**
 * Upload one work sample (image or document) to Supabase Storage (public `application-samples` bucket).
 */
export async function uploadApplicationSampleFromUri(
  uri: string,
  filename: string,
  mimeType: string,
  base64?: string,
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const path = `${user.id}/${randomObjectName(filename)}`;
  let bytes: Uint8Array;
  try {
    bytes = base64
      ? base64ToUint8Array(base64)
      : await readUriAsUint8Array(uri, mimeType || 'application/octet-stream', filename);
  } catch {
    throw new Error('Could not read the selected file. Pick it again and submit right away.');
  }
  if (!bytes.length) {
    throw new Error('Selected file is empty. Pick a different file.');
  }

  const { error } = await supabase.storage.from('application-samples').upload(path, bytes, {
    contentType: mimeType || 'application/octet-stream',
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('application-samples').getPublicUrl(path);
  return data.publicUrl;
}
