'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Product } from '@/lib/types/products';
import { getCachedImageUrl, fetchImageUrlAndCache, onCacheUpdate } from '@/lib/image-cache';

type HoverImageProps = {
  product: Product;
  className?: string;
  imgClassName?: string;
};

export default function HoverImage({ product, className, imgClassName }: HoverImageProps) {
  const imageId = product.relationships?.image?.data?.id;

  const initialUrl =
    product.image?.attributes?.thumbs?.["600x600"] ||
    product.image?.attributes?.thumbs?.["300x300"] ||
    product.attributes.thumbnail_url ||
    product.attributes.image_url ||
    null;

  const [url, setUrl] = useState<string | null>(initialUrl);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!url && imageId) {
      const cached = getCachedImageUrl(imageId);
      if (cached) setUrl(cached);
    }

    const unsubscribe = onCacheUpdate((id) => {
      if (id === imageId && !url) {
        const cached = imageId ? getCachedImageUrl(imageId) : undefined;
        if (cached) setUrl(cached);
      }
    });

    return unsubscribe;
  }, [imageId, url]);

  const handleMouseEnter = useCallback(() => {
    if (loading) return;
    if (url) return;
    if (!imageId) return;

    const cached = getCachedImageUrl(imageId);
    if (cached) {
      setUrl(cached);
      return;
    }

    setLoading(true);
    fetchImageUrlAndCache(imageId)
      .then((nextUrl) => {
        if (nextUrl) setUrl(nextUrl);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [imageId, loading, url]);

  return (
    <div className={className} onMouseEnter={handleMouseEnter}>
      {url ? (
        <img src={url} alt={product.attributes.name} className={imgClassName} />
      ) : (
        <div className={`bg-muted flex items-center justify-center ${imgClassName || ''}`}>
          <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </div>
  );
}


