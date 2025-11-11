'use client';

import { useCart } from '@/lib/cart/cart-context';
import { lookupSku, priceIndex } from '@/lib/sku-index';

type Props = {
  productId: string;
  variantId: string | null;
  name: string;
  sku: string | null;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
};

export default function CartItemRow({ productId, variantId, name, sku, imageUrl, unitPrice, quantity, totalPrice }: Props) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="flex items-center gap-4 py-4 border-b">
      <div className="w-16 h-16 bg-muted rounded overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-muted-foreground text-xs">No image</span>
        )}
      </div>
      <div className="flex-1">
        <div className="font-medium">{name}</div>
        <div className="text-xs text-muted-foreground">{sku ?? ''}</div>
      </div>
      <div className="w-24 text-sm">{unitPrice.toFixed(2)} лв</div>
      <div className="w-24 text-sm">{lookupSku(sku ?? '', priceIndex)?.['angro-inseason'] ?? '-'} лв</div>
      <div className="w-24">
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => updateQuantity(productId, variantId, Number(e.target.value) || 1)}
          className="w-20 border rounded px-2 py-1 text-sm"
        />
      </div>
      <div className="w-24 text-sm font-semibold">{totalPrice.toFixed(2)}</div>
      <div>
        <button className="text-red-600 text-sm" onClick={() => removeItem(productId, variantId)}>Remove</button>
      </div>
    </div>
  );
}


