'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import type { Variant } from '@/lib/types/products';
import { variantLabel } from '@/lib/variants';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type VariantSelection = Record<string, number>;

export type VariantMultiSelectModalItem = {
  variantId: string;
  quantity: number;
  unitPrice: number;
  sku: string | null;
  note: string;
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
  const clickTimersRef = useRef<Record<string, number[]>>({});
  const [selection, setSelection] = useState<VariantSelection>(() =>
    buildInitialSelection(initialSelectedIds)
  );
  const [tripleClickEnabled, setTripleClickEnabled] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    setSelection(buildInitialSelection(initialSelectedIds));
  }, [initialSelectedIds]);

  // Automatically uncheck disabled variants
  useEffect(() => {
    setSelection((prev) => {
      const updated = { ...prev };
      let hasChanges = false;

      variants.forEach((variant) => {
        const id = variant.id;
        const isDisabled = variant.attributes.quantity === 0 && !tripleClickEnabled.has(id);
        
        if (isDisabled && updated[id]) {
          delete updated[id];
          hasChanges = true;
        }
      });

      return hasChanges ? updated : prev;
    });
  }, [variants, tripleClickEnabled]);

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

  const setNoteForVariant = (variantId: string, note: string) => {
    setNotes((prev) => ({
      ...prev,
      [variantId]: note,
    }));
  };

  const decreaseQuantity = (variantId: string) => {
    setSelection((prev) => {
      const currentQty = prev[variantId] ?? 1;
      return {
        ...prev,
        [variantId]: Math.max(1, currentQty - 1),
      };
    });
  };

  const increaseQuantity = (variantId: string) => {
    setSelection((prev) => {
      const currentQty = prev[variantId] ?? 1;
      return {
        ...prev,
        [variantId]: currentQty + 1,
      };
    });
  };

  const handleClick = (variantId: string, hasZeroQuantity: boolean, event: MouseEvent) => {
    // Only handle triple-click for variants with zero quantity
    if (!hasZeroQuantity) return;

    const now = Date.now();
    const clicks = clickTimersRef.current[variantId] || [];
    
    // Filter out clicks older than 500ms
    const recentClicks = clicks.filter((time) => now - time < 500);
    recentClicks.push(now);
    clickTimersRef.current[variantId] = recentClicks;

    // If we have 3 clicks within 500ms, it's a triple click
    if (recentClicks.length >= 3) {
      event.preventDefault();
      event.stopPropagation();
      setTripleClickEnabled((prev) => {
        const next = new Set(prev);
        const wasEnabled = next.has(variantId);
        
        if (wasEnabled) {
          // Disabling: remove from triple-click enabled
          next.delete(variantId);
        } else {
          // Enabling: add to triple-click enabled
          next.add(variantId);
        }
        return next;
      });
      // Clear the click history after handling
      clickTimersRef.current[variantId] = [];
    }
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
          note: notes[variant.id] || '',
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
            <h2 id="variant-multi-select-heading" className="text-lg font-semibold text-foreground" title="Избери варианти">
              Select Variants
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{productName}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-transparent px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
          >
            <span title="Отказ">Cancel</span>
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
                const isDisabled = variant.attributes.quantity === 0 && !tripleClickEnabled.has(id);
                const isTripleClickEnabled = tripleClickEnabled.has(id);

                return (
                  <li
                    key={id}
                    className={`
                      rounded border transition
                      ${variant.attributes.quantity === 0
                        ? 'border-red-500 bg-red-50'
                        : isChecked
                          ? 'border-green-500 bg-green-50'
                          : 'border-border bg-white'
                      }
                    `}
                  >
                    <div className="flex">
                      <label 
                        className="flex  px-4 py-3 flex-1 cursor-pointer items-start gap-3"
                        onClick={(e) => handleClick(id, variant.attributes.quantity === 0, e)}
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4"
                          checked={isChecked}
                          onChange={() => toggleVariant(id)}
                          // Disable the checkbox if the variant is out of stock (quantity === 0) and not triple-click enabled
                          disabled={isDisabled}
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground">{label}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {/* {sku ? <span className="mr-3">SKU: {sku}</span> : null} */}
                            {/* {Number.isFinite(price) ? <span className="mr-3">${price.toFixed(2)}</span> : null} */}
                            {stockCount !== null ? <span title="Наличност">Stock: {stockCount}</span> : null}
                          </div>
                        </div>
                      </label>
                      {isChecked ? (
                        <>
                          <div className="flex items-center gap-2 px-4 py-3">
                            <span className="text-xs text-muted-foreground" title="Количество">Qty</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => decreaseQuantity(id)}
                                disabled={qty <= 1}
                                className="flex h-7 w-7 items-center justify-center rounded border border-border bg-white text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Decrease quantity"
                              >
                                <FontAwesomeIcon icon={faMinus} className="h-3 w-3" />
                              </button>
                              <input
                                type="number"
                                min={1}
                                value={qty}
                                onChange={(event) =>
                                  setQuantityForVariant(id, Number(event.target.value) || 1)
                                }
                                className={`w-16 rounded border border-border px-2 py-1 text-center text-sm ${
                                  stockCount !== null && qty > stockCount
                                    ? 'bg-red-100'
                                    : 'bg-white'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => increaseQuantity(id)}
                                className="flex h-7 w-7 items-center justify-center rounded border border-border bg-white text-sm hover:bg-muted"
                                aria-label="Increase quantity"
                              >
                                <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 px-4 py-3">
                            <span className="text-xs text-muted-foreground" title="Бележка">Note</span>
                            <input
                              type="text"
                              value={notes[id] || ''}
                              onChange={(event) => setNoteForVariant(id, event.target.value)}
                              placeholder="Optional note..."
                              title="Опционална бележка..."
                              className="flex-1 rounded border border-border px-2 py-1 text-sm"
                            />
                          </div>
                        </>
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
            <span title={selectedCount === 1 ? '1 избран вариант' : `${selectedCount} избрани варианта`}>{selectedCount} variant{selectedCount === 1 ? '' : 's'} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded border border-border px-4 py-1.5 text-sm hover:bg-muted"
            >
              <span title="Отказ">Cancel</span>
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
              title="Добави избрани"
            >
              Add Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


