import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hdrhvqguznybeklettww.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

let cachedOrgId = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || null;

let cachedOrgDetails = null;

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
 * Returns full Organization details from Supabase.
 */
export async function getActiveOrganizationDetails() {
  if (cachedOrgDetails) return cachedOrgDetails;

  try {
    const orgId = await getActiveOrgId();
    if (!orgId) return null;

    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .limit(1)
      .single();

    if (!error && data) {
      cachedOrgDetails = data;
      return cachedOrgDetails;
    }

    if (error) {
      console.warn('Organization details query note:', error.message);
    }
    return null;
  } catch (err) {
    console.error('Organization details fetch error:', err);
    return null;
  }
}

/**
 * Clears the cached organization details to force fresh fetch
 */
export function clearOrganizationCache() {
  cachedOrgDetails = null;
  cachedOrgId = null;
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

/**
 * Calculates and returns the next sequential unique Fera Number (e.g. FR-000001)
 * starting from 000001.
 */
export async function getNextFeraNumber(orgId = null) {
  try {
    const activeOrgId = orgId || (await getActiveOrgId());
    if (!activeOrgId) return 'FR-000001';

    const { data, error } = await supabase
      .from('feras')
      .select('fera_number')
      .eq('organization_id', activeOrgId);

    if (error || !data || data.length === 0) {
      return 'FR-000001';
    }

    let maxNum = 0;
    data.forEach((row) => {
      if (!row.fera_number) return;
      // Extract numeric components e.g., FR-000001 -> 1, FERA-684819 -> 684819, FR-000004 -> 4
      const matches = row.fera_number.match(/\d+/g);
      if (matches && matches.length > 0) {
        const lastNum = parseInt(matches[matches.length - 1], 10);
        if (!isNaN(lastNum) && lastNum > maxNum) {
          maxNum = lastNum;
        }
      }
    });

    const nextSeq = maxNum + 1;
    return `FR-${String(nextSeq).padStart(6, '0')}`;
  } catch (err) {
    console.error('Error calculating next fera number:', err);
    return 'FR-000001';
  }
}

/**
 * Calculates and returns the next sequential unique Fera Group Number (e.g. FG-000001)
 * starting from 000001.
 */
export async function getNextFeraGroupNumber(orgId = null) {
  try {
    const activeOrgId = orgId || (await getActiveOrgId());
    if (!activeOrgId) return 'FG-000001';

    const { data, error } = await supabase
      .from('fera_groups')
      .select('group_number')
      .eq('organization_id', activeOrgId);

    if (error || !data || data.length === 0) {
      return 'FG-000001';
    }

    let maxNum = 0;
    data.forEach((row) => {
      if (!row.group_number) return;
      // Extract numeric components e.g., FG-000001 -> 1
      const matches = row.group_number.match(/\d+/g);
      if (matches && matches.length > 0) {
        const lastNum = parseInt(matches[matches.length - 1], 10);
        if (!isNaN(lastNum) && lastNum > maxNum) {
          maxNum = lastNum;
        }
      }
    });

    const nextSeq = maxNum + 1;
    return `FG-${String(nextSeq).padStart(6, '0')}`;
  } catch (err) {
    console.error('Error calculating next fera group number:', err);
    return 'FG-000001';
  }
}



