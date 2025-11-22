'use client';

import { StoreProductPicker } from './StoreProductPicker';
import { StoreOrderCart } from './StoreOrderCart';

export function StoreOrderCreate() {
  return (
    <div className="space-y-6">
      {/* Product Selection */}
      <StoreProductPicker />

      {/* Cart */}
      <StoreOrderCart />
    </div>
  );
}

