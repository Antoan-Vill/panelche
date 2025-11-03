'use client';

import { useState, useEffect } from 'react';
import { Variant } from '@/lib/types/products';
import VariantItem from './VariantItem';
import { useVariantVisibility } from '@/lib/variant-visibility';
import { useProductVariants } from '@/hooks';

interface ProductVariantsProps {
  productId: string;
  updateStockAction?: (variantId: string, quantity: number) => Promise<number | null>;
}

export default function ProductVariants({ productId, updateStockAction }: ProductVariantsProps) {
  const { showVariants: globalShowVariants, registerVariantVisibility, forceCloseAll } = useVariantVisibility();
  const [isOpen, setIsOpen] = useState(false);
  const [isIndividuallyHidden, setIsIndividuallyHidden] = useState(false);
  const { data: variantsData, isLoading, error, reload } = useProductVariants(productId);
  const variants = (variantsData ?? null) as Variant[] | null;
  const hasFetched = variantsData !== undefined;

  // Use global state as primary, but allow individual override to hide
  const effectiveIsOpen = globalShowVariants ? !isIndividuallyHidden : isOpen;

  // Load variants when global state is activated and we haven't fetched yet
  useEffect(() => {
    if (globalShowVariants && !hasFetched && !isLoading) {
      reload();
    }
  }, [globalShowVariants, hasFetched, isLoading, reload]);

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

      if (nextOpen && !hasFetched && !isLoading) {
        void loadVariants();
      }
    }
  };

  const handleRetry = () => {
    reload();
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
              <span>{error}</span>
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
                <VariantItem key={variant.id} variant={variant} updateStockAction={updateStockAction} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

