import { NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/storage';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const folder = formData.get('folder') || 'veda_transport/documents';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await uploadToCloudinary(buffer, folder, file.name);

    return NextResponse.json({
      success: true,
      url: result.url,
      fileName: file.name,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload document' },
      { status: 500 }
    );
  }
}
