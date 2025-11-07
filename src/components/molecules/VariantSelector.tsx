'use client';

import { useMemo, useState } from 'react';
import type { Variant } from '@/lib/types/products';
import { variantLabel } from '@/lib/variants';

type VariantSelectorProps = {
  variants?: Variant[];
  priceCents?: number | null; // fallback if no variants
  baseSku?: string | null; // fallback if no variants
  enablePivotToMulti?: boolean;
  onRequestMultiSelect?: (context: { initialSelectedIds: string[] }) => void;
  onAdd: (payload: {
    selectedVariantId: string | null;
    quantity: number;
    unitPrice: number; // decimal units (e.g., 9.99)
    sku: string | null;
  }) => void;
};

export function VariantSelector({
  variants = [],
  priceCents = null,
  baseSku = null,
  enablePivotToMulti = false,
  onRequestMultiSelect,
  onAdd,
}: VariantSelectorProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(variants?.[0]?.id ?? null);

  const unitPrice = useMemo(() => {
    if (variants.length > 0 && selectedVariantId) {
      const v = variants.find((x) => x.id === selectedVariantId);
      if (v) return Number((v.attributes.price / 100).toFixed(2));
    }
    return Number(((priceCents ?? 0) / 100).toFixed(2));
  }, [variants, selectedVariantId, priceCents]);

  const sku = useMemo(() => {
    if (variants.length > 0 && selectedVariantId) {
      const v = variants.find((x) => x.id === selectedVariantId);
      return v?.attributes.sku ?? baseSku ?? null;
    }
    return baseSku ?? null;
  }, [variants, selectedVariantId, baseSku]);

  function handleAdd() {
    onAdd({
      selectedVariantId,
      quantity: Math.max(1, Math.floor(quantity)),
      unitPrice,
      sku,
    });
  }

  return (
    <div className="flex items-center gap-2">
      {variants.length > 0 && (
        <span
          className=""
          data-value={selectedVariantId ?? ''}
        >
          {variants.map((v) => {
            const handleClick = () => {
              if (
                enablePivotToMulti &&
                !!onRequestMultiSelect &&
                selectedVariantId &&
                selectedVariantId !== v.id
              ) {
                const initialSelectedIds = Array.from(
                  new Set([selectedVariantId, v.id])
                );
                onRequestMultiSelect({ initialSelectedIds });
                return;
              }
              setSelectedVariantId(v.id);
            };

            return (
              <span
                onClick={handleClick}
                key={v.id}
                data-value={v.id}
                className={`border rounded mr-3 px-3 py-2 text-sm cursor-pointer ${
                  v.attributes.quantity === 0
                    ? 'bg-red-100 border-red-500 text-red-700'
                    : 'bg-white'
                } ${selectedVariantId === v.id && v.attributes.quantity !== 0 ? 'border-green-500' : ''}`}
              >
              {/* {variantLabel(v)} {selectedVariantId === v.id ? 'selected '+selectedVariantId+ '/' + v.id : ''} */}
              {v.attributes.v1}
              </span>
            );
          })}
        </span>
      )}

      <input
        type="number"
        min={1}
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value) || 1)}
        className="w-16 bg-white border rounded px-2 py-1 text-sm"
      />

      <button
        onClick={handleAdd}
        className="py-1 px-2 rounded bg-green-600 text-white hover:bg-green-700 text-sm"
      >
        Add
      </button>
    </div>
  );
}


