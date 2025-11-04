'use client';

import { useEffect, useMemo } from 'react';
import { useVariantVisibility } from '@/lib/variant-visibility';
import { useVariantsPreload } from '@/lib/variants-preload';

export default function VariantsBatchPreloader({ productIds }: { productIds: string[] }) {
  const { showVariants } = useVariantVisibility();
  const { preload, getCachedVariants } = useVariantsPreload();

  const missing = useMemo(() => {
    const ids = Array.from(new Set(productIds)).filter(Boolean);
    return ids.filter((id) => !getCachedVariants(id));
  }, [productIds, getCachedVariants]);

  useEffect(() => {
    if (!showVariants) return;
    if (missing.length === 0) return;
    preload(missing).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showVariants, missing.join('|')]);

  return null;
}


