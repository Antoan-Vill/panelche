'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import type { Variant } from '@/lib/types/products';
import { variantLabel } from '@/lib/variants';

type VariantSelection = Record<string, number>;

export type VariantMultiSelectModalItem = {
  variantId: string;
  quantity: number;
  unitPrice: number;
  sku: string | null;
};

type VariantMultiSelectModalProps = {
  productId: string;
  productName: string;
  imageUrl?: string | null;
  baseSku?: string | null;
  priceCents?: number | null;
  variants: Variant[];
  initialSelectedIds: string[];
  onCancel: () => void;
  onConfirm: (items: VariantMultiSelectModalItem[]) => void;
};

function buildInitialSelection(initialIds: string[]): VariantSelection {
  return initialIds.reduce<VariantSelection>((acc, id) => {
    if (id) acc[id] = acc[id] ?? 1;
    return acc;
  }, {});
}

export function VariantMultiSelectModal({
  productName,
  imageUrl = null,
  baseSku = null,
  variants,
  priceCents = null,
  initialSelectedIds,
  onCancel,
  onConfirm,
}: VariantMultiSelectModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<VariantSelection>(() =>
    buildInitialSelection(initialSelectedIds)
  );

  useEffect(() => {
    setSelection(buildInitialSelection(initialSelectedIds));
  }, [initialSelectedIds]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const node = containerRef.current;
    node?.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    };

    const handleFocus = (event: FocusEvent) => {
      const current = containerRef.current;
      if (!current) return;
      if (current.contains(event.target as Node)) return;
      event.stopPropagation();
      current.focus({ preventScroll: true });
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocus);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocus);
      previouslyFocused?.focus?.();
    };
  }, [onCancel]);

  const selectedCount = useMemo(() => Object.keys(selection).length, [selection]);

  const variantMap = useMemo(() => {
    return variants.reduce<Record<string, Variant>>((acc, current) => {
      acc[current.id] = current;
      return acc;
    }, {});
  }, [variants]);

  const toggleVariant = (variantId: string) => {
    setSelection((prev) => {
      if (prev[variantId]) {
        const { [variantId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [variantId]: 1 };
    });
  };

  const setQuantityForVariant = (variantId: string, value: number) => {
    setSelection((prev) => ({
      ...prev,
      [variantId]: Math.max(1, Math.floor(Number.isFinite(value) ? value : 1)),
    }));
  };

  const handleConfirm = () => {
    const items: VariantMultiSelectModalItem[] = (variants || [])
      .filter((v) => Boolean(selection[v.id]))
      .map((variant) => {
        const quantity = Math.max(1, selection[variant.id] ?? 1);
        const rawPrice = variant.attributes.price ?? 0;
        const fallbackPrice = priceCents ?? 0;
        const unitPriceSource = rawPrice || fallbackPrice;
        const unitPrice = Number((unitPriceSource / 100).toFixed(2));
        const sku = variant.attributes.sku ?? baseSku ?? null;
        return {
          variantId: variant.id,
          quantity,
          unitPrice,
          sku,
        };
      });
    if (!items.length) return;
    onConfirm(items);
    onCancel();
  };

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    onCancel();
  };

  return (
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      role="presentation"
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="variant-multi-select-heading"
        className="w-full max-w-3xl rounded-lg bg-white shadow-xl outline-none"
      >
        <div className="flex items-start gap-3 border-b border-border px-6 py-4">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={productName}
              className="hidden h-16 w-16 flex-shrink-0 rounded object-cover sm:block"
            />
          ) : null}
          <div className="flex-1">
            <h2 id="variant-multi-select-heading" className="text-lg font-semibold text-foreground">
              Select Variants
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{productName}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-transparent px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
          >
            Cancel
          </button>
        </div>

        <div className="max-h-[26rem] overflow-y-auto px-6 py-4">
          {variants.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No variants available for this product.
            </div>
          ) : (
            <ul className="space-y-3">
              {variants.map((variant) => {
                const id = variant.id;
                const isChecked = Boolean(selection[id]);
                const qty = selection[id] ?? 1;
                const rawPrice = variant.attributes.price ?? 0;
                const fallbackPrice = priceCents ?? 0;
                const priceSource = rawPrice || fallbackPrice;
                const price = Number((priceSource / 100).toFixed(2));
                const sku = variant.attributes.sku ?? baseSku ?? null;
                const label = variantLabel(variant) || variant.attributes.v1 || 'Variant';
                const stockCount = typeof variant.attributes.quantity === 'number'
                  ? variant.attributes.quantity
                  : null;

                return (
                  <li
                    key={id}
                    className={`rounded border px-4 py-3 transition ${isChecked ? 'border-green-500 bg-green-50' : 'border-border bg-white'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <label className="flex flex-1 cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4"
                          checked={isChecked}
                          onChange={() => toggleVariant(id)}
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground">{label}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {sku ? <span className="mr-3">SKU: {sku}</span> : null}
                            {Number.isFinite(price) ? <span className="mr-3">${price.toFixed(2)}</span> : null}
                            {stockCount !== null ? <span>Stock: {stockCount}</span> : null}
                          </div>
                        </div>
                      </label>
                      {isChecked ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Qty</span>
                          <input
                            type="number"
                            min={1}
                            value={qty}
                            onChange={(event) =>
                              setQuantityForVariant(id, Number(event.target.value) || 1)
                            }
                            className="w-16 rounded border border-border px-2 py-1 text-sm"
                          />
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <div className="text-sm text-muted-foreground">
            {selectedCount} variant{selectedCount === 1 ? '' : 's'} selected
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded border border-border px-4 py-1.5 text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedCount === 0}
              className={`rounded px-4 py-1.5 text-sm text-white transition ${
                selectedCount === 0
                  ? 'cursor-not-allowed bg-muted text-muted-foreground'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              Add Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


