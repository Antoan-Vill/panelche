'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart/cart-context';
import { useTranslation } from '@/lib/i18n';

export default function CartSummary() {
  const { subtotal, total } = useCart();
  const { t } = useTranslation();

  return (
    <div className="p-4 bg-muted rounded border border-border">
      <div className="flex justify-between text-sm mb-2">
        <span>{t('orders.subtotal')}</span>
        <span>{subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between font-semibold">
        <span>{t('orders.total')}</span>
        <span>{total.toFixed(2)}</span>
      </div>

      <Link href="/store/checkout" className="mt-4 block text-center px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">
        <span>{t('store.proceedToCheckout')}</span>
      </Link>
    </div>
  );
}


