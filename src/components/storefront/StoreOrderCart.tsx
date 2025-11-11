'use client';

import Link from 'next/link';
import { lookupSku, priceIndex } from '@/lib/sku-index';
import { useCart } from '@/lib/cart/cart-context';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export function StoreOrderCart() {
  const { items, subtotal, total, updateQuantity, removeItem } = useCart();

  const handleQuantityChange = (productId: string, variantId: string | null, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantity(productId, variantId, newQuantity);
  };

  const generateItemId = (item: any) => {
    return `${item.productId}-${item.variantId || 'no-variant'}`;
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="uppercase text-xs opacity-50 mb-2 font-bold" title="Количка за поръчка">Order Cart</h3>

      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <span title="Няма артикули в количката. Добавете продукти, за да започнете.">No items in cart. Add products to get started.</span>
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
                  {item.sku && (
                    <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
                  )}
                  {item.note && (
                    <div className="text-xs text-muted-foreground italic" title="Бележка">Note: {item.note}</div>
                  )}
                  <div className="text-sm text-foreground">{item.unitPrice.toFixed(2)} лв</div>
                  {item.sku && <div className="text-sm text-foreground">{lookupSku(item.sku, priceIndex)?.['angro-inseason']} лв</div>}
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuantityChange(item.productId, item.variantId, item.quantity - 1)}
                    className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-muted"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.productId, item.variantId, parseInt(e.target.value) || 1)}
                    className="w-12 text-center border rounded px-1 py-1 text-sm"
                  />
                  <button
                    onClick={() => handleQuantityChange(item.productId, item.variantId, item.quantity + 1)}
                    className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-muted"
                  >
                    +
                  </button>
                </div>

                {/* Line Total */}
                <div className="text-sm font-medium w-16 text-right">
                  {item.totalPrice.toFixed(2)}
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeItem(item.productId, item.variantId)}
                  className="bg-red-100 rounded-md px-2 py-1 text-red-600 hover:text-red-800 text-sm"
                >
                  <FontAwesomeIcon icon={faXmark}  />
                  <span className="ml-2" title="Премахни">Remove</span>
                </button>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-sm">
              <span title="Междинна сума">Subtotal:</span>
              <span>{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center font-medium text-lg mt-2">
              <span title="Общо">Total:</span>
              <span>{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Cart Stats */}
          <div className="text-xs text-muted-foreground">
            <span title={items.length === 1 ? '1 артикул' : `${items.length} артикула`}>{items.length} item{items.length !== 1 ? 's' : ''}</span> • <span title="общо количество">{items.reduce((sum, item) => sum + item.quantity, 0)} total quantity</span>
          </div>

          {/* Proceed to Checkout Button */}
          <div className="pt-4">
            <Link
              href="/store/checkout"
              className="block w-full text-center px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
            >
              <span title="Продължи към плащане">Proceed to Checkout</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
