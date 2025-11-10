'use client';

import { useState } from 'react';
import { OwnerSelector } from './OwnerSelector';
import { AdminProductPicker } from './AdminProductPicker';
import { AdminOrderCart } from './AdminOrderCart';
import type { OrderOwner, AdminCartItem } from '@/lib/types/customers';
import type { OrderItem } from '@/lib/types/orders';
import { getAuth } from 'firebase/auth';
import { useCreateOrder } from '@/hooks';
import { useRouter } from 'next/navigation';

export function AdminOrderCreate() {
  const [owner, setOwner] = useState<OrderOwner | null>(null);
  const [cartItems, setCartItems] = useState<AdminCartItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { create, isLoading: creating } = useCreateOrder();

  const handleAddToCart = (item: Omit<AdminCartItem, 'lineTotal'>) => {
    const unitPrice = item.unitPrice || 0;
    const newItem: AdminCartItem = {
      ...item,
      unitPrice: unitPrice,
      lineTotal: unitPrice * item.quantity,
      sku: item.sku ?? null,
      note: item.note || '',
    };

    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (existing) =>
          existing.productId === newItem.productId &&
          existing.variantId === newItem.variantId &&
          existing.note === newItem.note
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        const quantity = existing.quantity + newItem.quantity;
        updated[existingIndex] = {
          ...existing,
          quantity,
          lineTotal: existing.unitPrice * quantity,
        };
        return updated;
      }

      return [...prev, newItem];
    });

  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    const updatedItems = cartItems.map((item) => {
      const currentItemId = `${item.productId}-${item.variantId || 'no-variant'}`;
      if (currentItemId === itemId) {
        const unitPrice = item.unitPrice || 0;
        return {
          ...item,
          quantity,
          lineTotal: unitPrice * quantity,
        };
      }
      return item;
    });
    setCartItems(updatedItems);
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems(cartItems.filter((item) => {
      const currentItemId = `${item.productId}-${item.variantId || 'no-variant'}`;
      return currentItemId !== itemId;
    }));
  };

  const handleSave = async () => {
    if (!owner || cartItems.length === 0) return;

    setError(null);
    setSaving(true);
    try {
      const items: OrderItem[] = cartItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku ?? null,
        variantId: item.variantId ?? null,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice || 0),
        totalPrice: Number(((item.unitPrice || 0) * item.quantity).toFixed(2)),
        angroPrice: 0,
        imageUrl: item.imageUrl ?? null,
        note: item.note,
      }));

      const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
      const total = subtotal;

      const auth = getAuth();
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error('You must be signed in.');
      }

      const idempotencyKey = (globalThis as any).crypto?.randomUUID?.() ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

      await create({ payload: { owner, items, subtotal, total }, idToken, idempotencyKey });

      // Reset form or navigate after success
      setCartItems([]);
      setOwner(null);
      router.push('/admin/orders');
    } catch (e: any) {
      setError(e?.message || 'Failed to save order');
    } finally {
      setSaving(false);
    }
  };

  const canProceed = owner !== null && cartItems.length > 0;

  return (
    <div className="space-y-6">
      {/* Owner Selection */}
      <OwnerSelector selectedOwner={owner} onOwnerChange={setOwner} />

      {/* Product Selection */}
      <AdminProductPicker onAddToCart={handleAddToCart} />

      {/* Cart */}
      <AdminOrderCart
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />

      {/* Continue Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={!canProceed || saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
      <span title={saving || creating ? 'Запазване…' : 'Запази поръчка'}>{saving || creating ? 'Saving…' : 'Save Order'}</span>
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600" title={error}>{error}</div>
      )}

      {/* Debug Info (temporary) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-muted rounded text-xs font-mono">
          <div>Owner: {owner ? JSON.stringify(owner, null, 2) : 'None'}</div>
          <div>Cart Items: {cartItems.length}</div>
        </div>
      )}
    </div>
  );
}
