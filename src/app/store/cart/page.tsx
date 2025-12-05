'use client';

import CartItemRow from '@/components/storefront/CartItemRow';
import CartSummary from '@/components/storefront/CartSummary';
import { useCart } from '@/lib/cart/cart-context';
import { useTranslation } from '@/lib/i18n';

export default function CartPage() {
  const { items } = useCart();
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 bg-card rounded border border-border">
        <div className="px-4 py-3 border-b font-medium">{t('store.yourCart')}</div>
        <div className="px-4">
          {items.length === 0 ? (
            <div className="text-muted-foreground py-6">{t('store.cartEmpty')}</div>
          ) : (
            items.map((it) => (
              <CartItemRow
                key={`${it.productId}:${it.variantId ?? 'default'}`}
                productId={it.productId}
                variantId={it.variantId}
                name={it.productName}
                sku={it.sku}
                imageUrl={it.imageUrl}
                unitPrice={it.unitPrice}
                quantity={it.quantity}
                totalPrice={it.totalPrice}
              />
            ))
          )}
        </div>
      </div>

      <div>
        <CartSummary />
      </div>
    </div>
  );
}


