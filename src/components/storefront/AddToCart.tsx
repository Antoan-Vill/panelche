'use client';

import { useCart } from '@/lib/cart/cart-context';
import type { Variant } from '@/lib/types/products';
import { VariantSelector } from '@/components/molecules/VariantSelector';

type Props = {
  productId: string;
  productName: string;
  baseSku?: string | null;
  imageUrl?: string | null;
  priceCents?: number | null; // fallback if no variants
  variants?: Variant[] | null;
};

export default function AddToCart({ productId, productName, baseSku = null, imageUrl = null, priceCents = null, variants = null }: Props) {
  const { addItem } = useCart();

  return (
    <VariantSelector
      variants={variants ?? []}
      baseSku={baseSku}
      priceCents={priceCents}
      onAdd={({ selectedVariantId, quantity, unitPrice, sku }) => {
        addItem({
          productId,
          productName,
          sku: sku ?? null,
          variantId: selectedVariantId ?? null,
          quantity,
          unitPrice,
          imageUrl: imageUrl ?? null,
          note: '',
        });
      }}
    />
  );
}


