import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary from environment variables
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Parse a Cloudinary URL to extract the resource public_id and type
 * @param {string} url 
 * @returns {{ publicId: string, publicIdWithExt: string, resourceType: string } | null}
 */
export function parseCloudinaryUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('cloudinary.com')) return null;

  try {
    const parsedUrl = new URL(url);
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
    const uploadIndex = pathParts.indexOf('upload');
    if (uploadIndex === -1) return null;

    const resourceType = uploadIndex > 0 ? pathParts[uploadIndex - 1] : 'image';
    let publicParts = pathParts.slice(uploadIndex + 1);

    // Skip version prefix (e.g., v1740000000)
    if (publicParts.length > 0 && /^v\d+$/.test(publicParts[0])) {
      publicParts = publicParts.slice(1);
    }

    if (publicParts.length === 0) return null;

    const fullPath = publicParts.join('/');
    const lastDotIndex = fullPath.lastIndexOf('.');
    let publicIdWithoutExt = fullPath;
    if (lastDotIndex !== -1) {
      publicIdWithoutExt = fullPath.substring(0, lastDotIndex);
    }

    return {
      publicId: publicIdWithoutExt,
      publicIdWithExt: fullPath,
      resourceType: resourceType === 'auto' ? 'image' : resourceType,
    };
  } catch (e) {
    console.warn('Error parsing storage URL:', url, e);
    return null;
  }
}

/**
 * Delete a file or asset from cloud storage
 * @param {string} publicIdOrUrl - The full Cloudinary URL or asset public_id
 * @returns {Promise<{ success: boolean, result?: any, error?: string }>}
 */
export async function deleteFromCloudinary(publicIdOrUrl) {
  if (!publicIdOrUrl) return { success: false, reason: 'No file identifier provided' };

  try {
    let publicId = publicIdOrUrl;
    let resourceType = 'image';
    let publicIdWithExt = publicIdOrUrl;

    if (typeof publicIdOrUrl === 'string' && publicIdOrUrl.includes('cloudinary.com')) {
      const parsed = parseCloudinaryUrl(publicIdOrUrl);
      if (parsed) {
        publicId = parsed.publicId;
        publicIdWithExt = parsed.publicIdWithExt;
        resourceType = parsed.resourceType;
      }
    }

    // Attempt 1: Standard destroy without extension
    let res = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
    if (res.result === 'ok') {
      return { success: true, result: res };
    }

    // Attempt 2: Try with extension (often needed for raw files like PDFs)
    if (publicIdWithExt && publicIdWithExt !== publicId) {
      res = await cloudinary.uploader.destroy(publicIdWithExt, { resource_type: 'raw', invalidate: true });
      if (res.result === 'ok') {
        return { success: true, result: res };
      }
    }

    // Attempt 3: Try raw type with publicId
    res = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw', invalidate: true });
    if (res.result === 'ok') {
      return { success: true, result: res };
    }

    // Attempt 4: Try video type
    res = await cloudinary.uploader.destroy(publicId, { resource_type: 'video', invalidate: true });
    return { success: res.result === 'ok', result: res };
  } catch (error) {
    console.error('Storage deletion failed for:', publicIdOrUrl, error);
    return { success: false, error: error.message };
  }
}

/**
 * Upload a file buffer / base64 string to Cloudinary
 * @param {Buffer | string} fileBuffer - The file data
 * @param {string} folder - Target folder inside Cloudinary (e.g., 'weight_slips', 'truck_expenses')
 * @param {string} filename - Optional original filename
 * @returns {Promise<{ url: string, public_id: string, format: string, bytes: number }>}
 */
export async function uploadToCloudinary(fileBuffer, folder = 'veda_transport/docs', filename = '') {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto', // supports images, pdfs, documents
        public_id: filename ? `${Date.now()}_${filename.replace(/\.[^/.]+$/, '')}` : `${Date.now()}`,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    if (Buffer.isBuffer(fileBuffer)) {
      uploadStream.end(fileBuffer);
    } else {
      // If base64 data URI
      cloudinary.uploader.upload(
        fileBuffer,
        {
          folder,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            bytes: result.bytes,
          });
        }
      );
    }
  });
}
