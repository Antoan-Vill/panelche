'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart/cart-context';

export default function CartSummary() {
  const { subtotal, total } = useCart();

  return (
    <div className="p-4 bg-muted rounded border border-border">
      <div className="flex justify-between text-sm mb-2">
        <span title="Междинна сума">Subtotal</span>
        <span>{subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between font-semibold">
        <span title="Общо">Total</span>
        <span>{total.toFixed(2)}</span>
      </div>

      <Link href="/store/checkout" className="mt-4 block text-center px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">
        <span title="Продължи към плащане">Proceed to Checkout</span>
      </Link>
    </div>
  );
}


