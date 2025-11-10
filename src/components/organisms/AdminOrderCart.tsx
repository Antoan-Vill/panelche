'use client';

import { lookupSku, priceIndex } from '@/lib/sku-index';
import { AdminCartItem } from '@/lib/types/customers';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface AdminOrderCartProps {
  items: AdminCartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
}

export function AdminOrderCart({ items, onUpdateQuantity, onRemoveItem }: AdminOrderCartProps) {
  const subtotal = items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
  const total = subtotal; // No taxes/shipping for now

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    onUpdateQuantity(itemId, newQuantity);
  };

  const generateItemId = (item: AdminCartItem) => {
    return `${item.productId}-${item.variantId || 'no-variant'}`;
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="uppercase text-xs opacity-50 mb-2 font-bold">Order Cart</h3>

      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No items in cart. Add products to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Cart Items */}
          <div className="space-y-3">
            {items.map((item) => (
              <div key={generateItemId(item)} className="flex items-center gap-3 p-3 border border-border rounded">
                {/* Product Image */}
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{item.productName}</div>
                  {item.variantLabel && (
                    <div className="text-xs text-muted-foreground">{item.variantLabel}</div>
                  )}
                  {item.note && (
                    <div className="text-xs text-muted-foreground italic">Note: {item.note}</div>
                  )}
                  <div className="text-sm text-foreground">{(item.unitPrice || 0).toFixed(2)} лв</div>
                  {item.sku && <div className="text-sm text-foreground">{lookupSku(item.sku, priceIndex)?.['angro-inseason']} лв</div>}
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuantityChange(generateItemId(item), item.quantity - 1)}
                    className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-muted"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(generateItemId(item), parseInt(e.target.value) || 1)}
                    className="w-12 text-center border rounded px-1 py-1 text-sm"
                  />
                  <button
                    onClick={() => handleQuantityChange(generateItemId(item), item.quantity + 1)}
                    className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-muted"
                  >
                    +
                  </button>
                </div>

                {/* Line Total */}
                <div className="text-sm font-medium w-16 text-right">
                  ${(item.lineTotal || 0).toFixed(2)}
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => onRemoveItem(generateItemId(item))}
                  className="bg-red-100 rounded-md px-2 py-1 text-red-600 hover:text-red-800 text-sm"
                >
                  <FontAwesomeIcon icon={faXmark}  />
                  <span className="ml-2">Remove</span>
                </button>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-sm">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center font-medium text-lg mt-2">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Cart Stats */}
          <div className="text-xs text-muted-foreground">
            {items.length} item{items.length !== 1 ? 's' : ''} • {items.reduce((sum, item) => sum + item.quantity, 0)} total quantity
          </div>
        </div>
      )}
    </div>
  );
}
