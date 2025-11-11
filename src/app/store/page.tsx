'use client';

import { StoreOrderCreate } from '@/components/storefront/StoreOrderCreate';

export default function StoreHomePage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Shop</h1>
        <p className="text-muted-foreground mt-1">
          Browse products and add them to your cart to get started.
        </p>
      </div>

      <StoreOrderCreate />
    </div>
  );
}


