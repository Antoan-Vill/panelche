'use client';

import { useCallback, useMemo, useState } from 'react';
import type { Product } from '@/lib/types/products';
import { getCachedImageUrl, prefetchImages } from '@/lib/image-cache';

type LoadAllImagesButtonProps = {
  products: Product[];
};

export default function LoadAllImagesButton({ products }: LoadAllImagesButtonProps) {
  const imageIdsToFetch = useMemo(() => {
    return products
      .map((p) => {
        const id = p.relationships?.image?.data?.id;
        const hasLocalUrl = !!(
          p.image?.attributes?.thumbs?.["600x600"] ||
          p.image?.attributes?.thumbs?.["300x300"] ||
          p.attributes.thumbnail_url ||
          p.attributes.image_url
        );
        return { id, hasLocalUrl };
      })
      .filter((x) => !!x.id && !x.hasLocalUrl && !getCachedImageUrl(x.id as string))
      .map((x) => x.id as string);
  }, [products]);

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(0);
  const total = imageIdsToFetch.length;

  const handleClick = useCallback(async () => {
    if (loading || total === 0) return;
    setLoading(true);
    setDone(0);
    await prefetchImages(imageIdsToFetch, 3, (completed) => setDone(completed));
    setLoading(false);
  }, [imageIdsToFetch, loading, total]);

  if (total === 0) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="text-sm font-medium text-blue-600 hover:text-blue-800 px-3 py-1 rounded border border-blue-200 hover:border-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span title={loading ? `Зареждане на изображения ${done}/${total}` : `Зареди изображения (${total})`}>{loading ? `Loading images ${done}/${total}` : `Load images (${total})`}</span>
    </button>
  );
}


