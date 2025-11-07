'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { OrderItem } from '@/lib/types/orders';
import { lookupSku, priceIndex } from '../sku-index';

type CartState = {
  items: OrderItem[];
  subtotal: number;
  total: number;
};

type CartContextValue = CartState & {
  addItem: (item: Omit<OrderItem, 'totalPrice' | 'angroPrice'>) => void;
  updateQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  clear: () => void;
};

const STORAGE_KEY = 'storefront.cart.v1';

const CartContext = createContext<CartContextValue | undefined>(undefined);

function computeTotals(items: OrderItem[]): { subtotal: number; total: number } {
  const subtotal = items.reduce((sum, it) => sum + it.totalPrice, 0);
  const total = subtotal; // no shipping/taxes in scope
  return { subtotal, total };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<OrderItem[]>([]);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: OrderItem[] = JSON.parse(raw);
        // Validate minimal shape
        if (Array.isArray(parsed)) {
          setItems(
            parsed.map((it) => ({
              productId: String(it.productId),
              productName: String(it.productName),
              sku: it.sku ?? null,
              variantId: it.variantId ?? null,
              quantity: Math.max(1, Math.floor(Number(it.quantity) || 1)),
              unitPrice: Number(it.unitPrice) || 0,
              totalPrice: Number(it.totalPrice) || ((Number(it.unitPrice) || 0) * Math.max(1, Math.floor(Number(it.quantity) || 1))),
              angroPrice: Number(it.angroPrice) || 0,
              imageUrl: it.imageUrl ?? null,
            }))
          );
        }
      }
    } catch {}
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const addItem = useCallback((item: Omit<OrderItem, 'totalPrice' | 'angroPrice'>) => {
    setItems((prev) => {
      const keyMatch = (it: OrderItem) => it.productId === item.productId && it.variantId === item.variantId;
      const existing = prev.findIndex(keyMatch);
      if (existing >= 0) {
        const newItems = [...prev];
        const nextQty = newItems[existing].quantity + item.quantity;
        newItems[existing] = {
          ...newItems[existing],
          quantity: nextQty,
          totalPrice: Number((nextQty * newItems[existing].unitPrice).toFixed(2)),
        };
        return newItems;
      }
      const angroUnitPrice = item.sku ? lookupSku(item.sku, priceIndex)?.['angro-inseason'] ?? 0 : 0;
      const toInsert: OrderItem = {
        ...item,
        totalPrice: Number((item.quantity * item.unitPrice).toFixed(2)),
        angroPrice: Number((item.quantity * angroUnitPrice).toFixed(2)),
      };
      return [...prev, toInsert];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, variantId: string | null, quantity: number) => {
    setItems((prev) => prev.map((it) => {
      if (it.productId === productId && it.variantId === variantId) {
        const nextQty = Math.max(1, Math.floor(quantity));
        return { ...it, quantity: nextQty, totalPrice: Number((nextQty * it.unitPrice).toFixed(2)) };
      }
      return it;
    }));
  }, []);

  const removeItem = useCallback((productId: string, variantId: string | null) => {
    setItems((prev) => prev.filter((it) => !(it.productId === productId && it.variantId === variantId)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const { subtotal, total } = useMemo(() => computeTotals(items), [items]);

  const value = useMemo<CartContextValue>(() => ({ items, subtotal, total, addItem, updateQuantity, removeItem, clear }), [items, subtotal, total, addItem, updateQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}


