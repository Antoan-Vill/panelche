'use client';

import { useMemo, useState } from 'react';
import type { Variant } from '@/lib/types/products';
import { variantLabel } from '@/lib/variants';

type VariantSelectorProps = {
  variants?: Variant[];
  priceCents?: number | null; // fallback if no variants
  baseSku?: string | null; // fallback if no variants
  onAdd: (payload: {
    selectedVariantId: string | null;
    quantity: number;
    unitPrice: number; // decimal units (e.g., 9.99)
    sku: string | null;
  }) => void;
};

export function VariantSelector({ variants = [], priceCents = null, baseSku = null, onAdd }: VariantSelectorProps) {
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
        <select
          className="border rounded px-2 py-1 text-sm"
          value={selectedVariantId ?? ''}
          onChange={(e) => setSelectedVariantId(e.target.value)}
        >
          {variants.map((v) => (
            <option key={v.id} value={v.id}>
              {variantLabel(v)}
            </option>
          ))}
        </select>
      )}

      <input
        type="number"
        min={1}
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value) || 1)}
        className="w-16 border rounded px-2 py-1 text-sm"
      />

      <button
        onClick={handleAdd}
        className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700 text-sm"
      >
        Add
      </button>
    </div>
  );
}


