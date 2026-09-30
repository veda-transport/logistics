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
 * Upload a file buffer / base64 string to Cloudinary
 * @param {Buffer | string} fileBuffer - The file data
 * @param {string} folder - Target folder inside Cloudinary (e.g., 'weight_slips', 'truck_expenses')
 * @param {string} filename - Optional original filename
 * @returns {Promise<{ url: string, public_id: string, format: string }>}
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
