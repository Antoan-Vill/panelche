import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { base64Image } = await request.json();

    // Validate base64 image data
    if (!base64Image || typeof base64Image !== 'string') {
      return NextResponse.json(
        { error: 'Missing image data' },
        { status: 400 }
      );
    }

    if (!base64Image.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid image format' },
        { status: 400 }
      );
    }

    // Check approximate size (base64 string length * 0.75 ≈ original bytes)
    const estimatedBytes = base64Image.length * 0.75;
    if (estimatedBytes > 750 * 1024) { // ~750KB limit for Firestore safety
      return NextResponse.json(
        { error: 'Image too large for storage' },
        { status: 400 }
      );
    }

    // Check if product exists
    const productRef = adminDb.collection('products').doc(id);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Update the product document with the base64 image
    await productRef.update({
      'attributes.image_base64': base64Image,
      'attributes.image_base64_updated_at': new Date().toISOString(),
    });

    return NextResponse.json({ 
      success: true,
      message: 'Image saved successfully'
    });
  } catch (error) {
    console.error('Failed to save product image:', error);
    return NextResponse.json(
      { error: 'Failed to save image' },
      { status: 500 }
    );
  }
}

// Optional: DELETE endpoint to remove the image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const productRef = adminDb.collection('products').doc(id);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Remove the base64 image fields
    await productRef.update({
      'attributes.image_base64': null,
      'attributes.image_base64_updated_at': null,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Image removed successfully'
    });
  } catch (error) {
    console.error('Failed to remove product image:', error);
    return NextResponse.json(
      { error: 'Failed to remove image' },
      { status: 500 }
    );
  }
}
