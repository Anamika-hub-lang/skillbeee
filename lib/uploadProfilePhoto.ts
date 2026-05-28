import { base64ToUint8Array, readUriAsUint8Array } from '@/lib/storage/uriToUploadBody';
import { supabase } from '@/lib/supabase';

function randomObjectName(filename: string): string {
  const ext = filename.includes('.') ? filename.slice(filename.lastIndexOf('.')) : '.jpg';
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
}

export async function uploadProfilePhotoFromUri(
  uri: string,
  filename: string,
  mimeType: string,
  base64?: string,
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const path = `profile-photos/${user.id}/${randomObjectName(filename)}`;
  const bytes = base64
    ? base64ToUint8Array(base64)
    : await readUriAsUint8Array(uri, mimeType || 'image/jpeg');
  const { error } = await supabase.storage.from('application-samples').upload(path, bytes, {
    contentType: mimeType || 'image/jpeg',
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('application-samples').getPublicUrl(path);
  return data.publicUrl;
}
