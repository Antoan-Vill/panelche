'use client';

import { useState, useEffect } from 'react';
import { Variant } from '@/lib/types/products';
import VariantItem from './VariantItem';
import { useVariantVisibility } from '@/lib/variant-visibility';
import { useProductVariants } from '@/hooks';
import { useVariantsPreload } from '@/lib/variants-preload';

interface ProductVariantsProps {
  productId: string;
}

export default function ProductVariants({ productId }: ProductVariantsProps) {
  const { showVariants: globalShowVariants, registerVariantVisibility, forceCloseAll } = useVariantVisibility();
  const [isOpen, setIsOpen] = useState(false);
  const [isIndividuallyHidden, setIsIndividuallyHidden] = useState(false);
  // Use global state as primary, but allow individual override to hide
  const effectiveIsOpen = globalShowVariants ? !isIndividuallyHidden : isOpen;
  // Check batch-preloaded cache first, only fetch if missing
  const { getCachedVariants } = useVariantsPreload();
  const cached = effectiveIsOpen ? getCachedVariants(productId) : undefined;
  // Always enable the hook when panel is open; show cache immediately, fetch in background
  const shouldFetch = effectiveIsOpen;
  const { data: variantsData, isLoading, error, errorDetails, reload } = useProductVariants(shouldFetch ? productId : null, {
    autoRetry: true,
    untilHasData: true,
    initialDelayMs: 800,
    backoffFactor: 1.8,
    maxDelayMs: 5000,
    maxAttempts: 10,
  });
  // Prefer freshly fetched data over cached entries (cached [] could mask real data)
  const variants = (variantsData ?? cached ?? null) as Variant[] | null;
  const hasFetched = cached !== undefined || variantsData !== undefined;


  // Register visibility state changes
  useEffect(() => {
    registerVariantVisibility(productId, effectiveIsOpen);
  }, [productId, effectiveIsOpen, registerVariantVisibility]);

  // Force close when hideAllVariants is called
  useEffect(() => {
    if (forceCloseAll > 0) {
      setIsOpen(false);
      setIsIndividuallyHidden(false);
    }
  }, [forceCloseAll]);

  // Reset individually hidden when global show is toggled
  useEffect(() => {
    if (!globalShowVariants) {
      setIsIndividuallyHidden(false);
    }
  }, [globalShowVariants]);

  const handleToggle = () => {
    if (globalShowVariants) {
      // When global show is active, toggle individual hidden state
      setIsIndividuallyHidden(!isIndividuallyHidden);
    } else {
      // When global show is inactive, normal individual toggle
      const nextOpen = !isOpen;
      setIsOpen(nextOpen);
    }
  };

  const handleRetry = () => {
    if (isLoading) return;
    reload();
  };

  const handleShowErrorDetails = () => {
    if (!errorDetails) return;
    try {
      console.log(errorDetails);
      alert(typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails, null, 2));
    } catch {
      alert(String(errorDetails));
    }
  };

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={handleToggle}
        className="text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        {effectiveIsOpen ? 'Hide variants' : 'Show variants'}
      </button>

      {effectiveIsOpen && (
        <div className="mt-2">
          {isLoading && (
            <p className="text-xs text-muted-foreground">Loading variants…</p>
          )}

          {error && !isLoading && (
            <div className="flex items-center justify-between text-xs text-red-600">
              {errorDetails ? (
                <button type="button" onClick={handleShowErrorDetails} className="underline">
                  {error}
                </button>
              ) : (
                <span>{error}</span>
              )}
              <button
                type="button"
                onClick={handleRetry}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && hasFetched && (variants?.length ?? 0) === 0 && (
            <p className="text-xs text-muted-foreground">No variants found.</p>
          )}

          {!isLoading && !error && hasFetched && (variants?.length ?? 0) > 0 && (
            <div className="space-y-1">
              {variants?.map((variant) => (
                <VariantItem key={variant.id} variant={variant} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

