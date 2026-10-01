import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hdrhvqguznybeklettww.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

let cachedOrgId = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || null;

/**
 * Returns the active Organization ID from Supabase.
 */
export async function getActiveOrgId() {
  if (cachedOrgId) return cachedOrgId;

  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name')
      .order('created_at', { ascending: true })
      .limit(1);

    if (!error && data && data.length > 0) {
      cachedOrgId = data[0].id;
      return cachedOrgId;
    }

    if (error) {
      console.warn('Organization query note:', error.message);
    }

    return null;
  } catch (err) {
    console.error('Organization resolution failed:', err);
    return null;
  }
}

/**
 * Direct unsigned upload to Cloudinary from browser
 */
export async function uploadFileToCloudinary(file, folder = 'veda_transport/documents') {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'aijmcwlj';
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'veda_transport_docs';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Document upload failed. Please try again.');
  }

  const data = await res.json();
  return {
    url: data.secure_url,
    fileName: file.name,
    format: data.format,
    bytes: data.bytes,
  };
}

/**
 * Request server to delete file(s) from cloud storage
 * @param {string | string[]} fileUrlOrUrls 
 */
export async function deleteFileFromStorage(fileUrlOrUrls) {
  if (!fileUrlOrUrls) return;
  try {
    const isArray = Array.isArray(fileUrlOrUrls);
    const body = isArray ? { fileUrls: fileUrlOrUrls } : { fileUrl: fileUrlOrUrls };

    const res = await fetch('/api/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.warn('Storage deletion response:', await res.text());
    }
  } catch (err) {
    console.warn('Could not delete storage file:', err);
  }
}

