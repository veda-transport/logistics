import { NextResponse } from 'next/server';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/storage';

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

export async function DELETE(request) {
  try {
    const body = await request.json();
    const { fileUrl, fileUrls, publicId } = body || {};

    let targets = [];
    if (Array.isArray(fileUrls)) {
      targets = fileUrls.filter(Boolean);
    } else if (fileUrl) {
      targets = [fileUrl];
    } else if (publicId) {
      targets = [publicId];
    }

    if (targets.length === 0) {
      return NextResponse.json({ error: 'No file URL or identifier provided' }, { status: 400 });
    }

    const results = await Promise.all(targets.map((target) => deleteFromCloudinary(target)));

    return NextResponse.json({
      success: true,
      message: 'Storage assets deleted successfully',
      results,
    });
  } catch (error) {
    console.error('Delete storage file error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete file from storage' },
      { status: 500 }
    );
  }
}

