'use client';

import { useState, useCallback } from 'react';
import type { Product } from '@/lib/types/products';

interface ProductImageDropZoneProps {
  product: Product;
  children: React.ReactNode;
  className?: string;
}

export default function ProductImageDropZone({ 
  product, 
  children, 
  className = '' 
}: ProductImageDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(
    product.attributes.image_base64 || null
  );
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError(null);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Not an image');
      return;
    }

    // Validate file size (500KB limit for Firestore safety)
    if (file.size > 500 * 1024) {
      setError('Image too large (max 500KB)');
      return;
    }

    // Convert to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Upload to Firestore
    setIsUploading(true);
    try {
      const res = await fetch(`/api/products/${product.id}/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Image: base64 }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Upload failed');
      }
      
      setUploadedImage(base64);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      console.error('Image upload error:', err);
    } finally {
      setIsUploading(false);
    }
  }, [product.id]);

  const handleClearImage = useCallback(() => {
    setUploadedImage(null);
    setError(null);
  }, []);

  return (
    <div
      className={`relative ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Show uploaded image or existing content */}
      {uploadedImage ? (
        <div className="relative">
          <img 
            src={uploadedImage} 
            alt={product.attributes.name} 
            className="w-full h-48 object-cover"
          />
          {/* <button
            type="button"
            onClick={handleClearImage}
            className="absolute top-2 left-2 bg-black/50 hover:bg-black/70 text-white text-xs px-2 py-1 rounded z-10 transition-colors"
            title="Show original"
          >
            ✕
          </button> */}
        </div>
      ) : (
        children
      )}

      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500/50 flex items-center justify-center z-20 pointer-events-none">
          <div className="bg-white/90 px-4 py-2 rounded-lg shadow">
            <span className="text-blue-600 font-medium">Drop image here</span>
          </div>
        </div>
      )}

      {/* Uploading overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20 pointer-events-none">
          <div className="bg-white px-4 py-2 rounded-lg shadow">
            <span className="text-gray-700">Uploading...</span>
          </div>
        </div>
      )}

      {/* Error badge */}
      {error && (
        <button
          type="button"
          onClick={() => setError(null)}
          className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded z-10 transition-colors"
          title="Click to dismiss"
        >
          {error}
        </button>
      )}

      {/* Success indicator */}
      {false && uploadedImage && !isUploading && !error && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded z-10">
          ✓ Saved
        </div>
      )}
    </div>
  );
}
