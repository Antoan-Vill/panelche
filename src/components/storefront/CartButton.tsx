'use client';

import { useCart } from '@/lib/cart/cart-context';

interface CartButtonProps {
  onClick?: () => void;
}

export default function CartButton({ onClick }: CartButtonProps) {
  const { items } = useCart();
  const count = items.reduce((sum, it) => sum + it.quantity, 0);

  return (
    <button
      onClick={onClick}
      className="relative inline-flex items-center px-3 py-2 rounded bg-gray-900 text-white hover:bg-gray-800"
    >
      <span className="mr-2">Cart</span>
      <span className="inline-flex items-center justify-center text-xs font-semibold w-5 h-5 rounded-full bg-white text-gray-900">
        {count}
      </span>
    </button>
  );
}


