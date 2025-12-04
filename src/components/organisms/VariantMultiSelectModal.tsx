'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import type { Product, Variant } from '@/lib/types/products';
import { variantLabel } from '@/lib/variants';
import { priceIndex, lookupSku } from '@/lib/sku-index';
import { faExternalLink, faExternalLinkAlt, faFontAwesome, faMinus, faNoteSticky, faPencil, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
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
  product: Product;
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
  product,
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
  const noteModalRef = useRef<HTMLDivElement>(null);
  const clickTimersRef = useRef<Record<string, number[]>>({});
  const [selection, setSelection] = useState<VariantSelection>(() =>
    buildInitialSelection(initialSelectedIds)
  );
  const [tripleClickEnabled, setTripleClickEnabled] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [noteModalOpenFor, setNoteModalOpenFor] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState<string>('');

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
      const noteModal = noteModalRef.current;
      if (!current) return;
      // Don't refocus if focus is within the main modal or the note modal
      if (current.contains(event.target as Node)) return;
      if (noteModal && noteModal.contains(event.target as Node)) return;
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

  // Lock body scroll when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

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
        const sku = variant.attributes.sku ?? baseSku ?? null;

        // Try to get angro price first, fall back to retail price
        const angroPrice = sku ? lookupSku(sku, priceIndex)?.['angro-inseason'] : null;
        let unitPrice: number;
        if (angroPrice) {
          unitPrice = Number(angroPrice.toFixed(2));
        } else {
          const rawPrice = variant.attributes.price ?? 0;
          const fallbackPrice = priceCents ?? 0;
          const unitPriceSource = rawPrice || fallbackPrice;
          unitPrice = Number((unitPriceSource / 100).toFixed(2));
        }

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

  const handleNoteModalOpen = (variantId: string) => {
    setTempNote(notes[variantId] || '');
    setNoteModalOpenFor(variantId);
  };

  const handleNoteModalClose = () => {
    setNoteModalOpenFor(null);
    setTempNote('');
  };

  const handleNoteModalSave = () => {
    if (noteModalOpenFor) {
      setNoteForVariant(noteModalOpenFor, tempNote);
      handleNoteModalClose();
    }
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
        className="w-full max-w-3xl rounded-lg bg-white dark:bg-card shadow-xl outline-none"
      >
        <div className="flex items-start gap-3 border-b border-border p-4">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={productName}
              className="hidden h-16 w-16 flex-shrink-0 rounded object-cover sm:block"
            />
          ) : null}
          <div className="flex-1">
            <h2 id="variant-multi-select-heading" className="text-lg font-semibold text-foreground" title="Избери варианти">
              <span className="flex items-center gap-2">
                <a href={`${process.env.NEXT_PUBLIC_SITE_URL}/product/${product.attributes.url_handle}`} target="_blank" rel="noopener noreferrer">
                  {productName}
                </a>
                <a href={`${process.env.NEXT_PUBLIC_SITE_URL}/admin/products/edit/${product.id}`} target="_blank" rel="noopener noreferrer">
                  <sup>
                    <FontAwesomeIcon icon={faExternalLink} className="ml-1" />
                  </sup>
                </a>
              </span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-transparent py-1 text-sm text-muted-foreground hover:bg-muted"
          >
            <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
          </button>
        </div>

        <div className="max-h-[26rem] overflow-y-auto">
          {variants.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No variants available for this product.
            </div>
          ) : (
            <ul className="space-y-0">
              {variants.map((variant) => {
                const id = variant.id;
                const isChecked = Boolean(selection[id]);
                const qty = selection[id] ?? 1;
                const sku = variant.attributes.sku ?? baseSku ?? null;

                // Try to get angro price first, fall back to retail price
                const angroPrice = sku ? lookupSku(sku, priceIndex)?.['angro-inseason'] : null;
                let price: number;
                if (angroPrice) {
                  price = Number(angroPrice.toFixed(2));
                } else {
                  const rawPrice = variant.attributes.price ?? 0;
                  const fallbackPrice = priceCents ?? 0;
                  const priceSource = rawPrice || fallbackPrice;
                  price = Number((priceSource / 100).toFixed(2));
                }
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
                      transition
                      ${variant.attributes.quantity === 0
                        ? 'border-b border-red-500 bg-red-50 dark:bg-red-950/30 dark:border-red-800'
                        : isChecked
                          ? 'border-y border-green-500 bg-green-50 dark:bg-green-950/30 dark:border-green-800'
                          : 'border-b border-border bg-white dark:bg-card'
                      }
                    `}
                  >
                    <div className="flex">
                      <label
                        className="flex flex-1 gap-3 px-4 py-3"
                        onClick={(e) => handleClick(id, variant.attributes.quantity === 0, e)}
                      >
                        <div className='flex flex-col items-center justify-center'>
                          <span className='font-medium text-foreground'>{label}</span>
                          <input
                            type="checkbox"
                            className="h-full w-4"
                            checked={isChecked}
                            onChange={() => toggleVariant(id)}
                            // Disable the checkbox if the variant is out of stock (quantity === 0) and not triple-click enabled
                            disabled={isDisabled}
                          />
                        </div>
                        <div className='flex flex-1 justify-between align-center -border'>
                          <div className={`flex items-center rounded p-1 ${variant.attributes.quantity && !isChecked ? 'bg-muted' : ''}`}>
                            <div className="text-sm">
                              {sku ? <span className="mr-3 whitespace-nowrap text-muted-foreground">{sku}</span> : null}
                              {stockCount !== null ? <span className="text-xs whitespace-nowrap" title="Наличност">Stock: {stockCount}</span> : null}
                            </div>
                          </div>
                          <div className='flex items-center'>
                            <div className='flex items-center -my-1'>
                              {isChecked ? (
                                <>
                                  <div className="flex self-stretch items-center">
                                    <button
                                      type="button"
                                      onClick={() => decreaseQuantity(id)}
                                      disabled={qty <= 1}
                                      className="flex h-full w-7 items-center justify-center px-5 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                      aria-label="Decrease quantity"
                                    >
                                      <FontAwesomeIcon icon={faMinus} className="h-3 w-3" />
                                    </button>
                                    <input
                                      name={`variant-qty-input-${id}`}
                                      type="number"
                                      min={1}
                                      value={qty}
                                      onChange={(event) =>
                                        setQuantityForVariant(id, Number(event.target.value) || 1)
                                      }
                                      className={`h-full w-16 px-2 border border-border text-center rounded-sm text-foreground ${stockCount !== null && qty > stockCount
                                          ? 'bg-red-100 dark:bg-red-900/50'
                                          : 'bg-white dark:bg-background'
                                        }`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => increaseQuantity(id)}
                                      className="flex h-full w-7 items-center justify-center px-5 text-sm hover:bg-muted"
                                      aria-label="Increase quantity"
                                    >
                                      <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-2 px-4 py-3">
                                    <span
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        handleNoteModalOpen(id);
                                      }}
                                      className="flex-1 cursor-pointer"
                                      title={notes[id] ? notes[id] : "Click to add note..."}
                                    >
                                      {notes[id] ? <FontAwesomeIcon icon={faPencil} className="h-3 w-3" /> : <FontAwesomeIcon icon={faNoteSticky} className="h-3 w-3" />}
                                    </span>
                                  </div>
                                </>
                              ) : null}
                            </div>
                            {Number.isFinite(price) ? <span className="flex items-center text-sm whitespace-nowrap font-medium ">{price.toFixed(2)} лв</span> : null}
                          </div>
                        </div>
                      </label>
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
              className={`rounded px-4 py-1.5 text-sm text-white transition ${selectedCount === 0
                  ? 'cursor-not-allowed bg-black/25'
                  : 'bg-green-600 hover:bg-green-700'
                }`}
              title="Добави избрани"
            >
              Add Selected
            </button>
          </div>
        </div>
      </div>

      {/* Note Edit Modal */}
      {noteModalOpenFor && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4"
          onClick={handleNoteModalClose}
          role="presentation"
        >
          <div
            ref={noteModalRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="note-edit-heading"
            className="w-full max-w-md rounded-lg bg-white shadow-xl outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 border-b border-border px-6 py-4">
              <div className="flex-1">
                <h2 id="note-edit-heading" className="text-lg font-semibold text-foreground" title="Редактирай бележка">
                  Note for "{variantMap[noteModalOpenFor] ? variantLabel(variantMap[noteModalOpenFor]) || variantMap[noteModalOpenFor].attributes.v1 || 'Variant' : 'Variant'}"
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  write a note for this variant
                </p>
              </div>
              <button
                type="button"
                onClick={handleNoteModalClose}
                className="rounded border border-transparent py-1 text-sm text-muted-foreground hover:bg-muted"
              >
                <span title="Отказ">
                  <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
                </span>
              </button>
            </div>

            <div className="px-6 py-2">
              <textarea
                id="variant-note-textarea"
                value={tempNote}
                onChange={(event) => setTempNote(event.target.value)}
                placeholder="Optional note..."
                title="Опционална бележка..."
                className="block w-full bg-black/5 rounded border border-border px-3 py-2 text-sm min-h-[100px] resize-y"
                autoFocus
                rows={10}
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
              <button
                type="button"
                onClick={handleNoteModalClose}
                className="rounded border border-border px-4 py-1.5 text-sm hover:bg-muted"
              >
                <span title="Отказ">Cancel</span>
              </button>
              <button
                type="button"
                onClick={handleNoteModalSave}
                className="rounded px-4 py-1.5 text-sm text-white bg-green-600 hover:bg-green-700"
                title="Запази"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


