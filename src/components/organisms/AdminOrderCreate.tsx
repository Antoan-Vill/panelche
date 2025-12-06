'use client';

import { useState, useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OwnerSelector } from './OwnerSelector';
import { AdminProductPicker } from './AdminProductPicker';
import { AdminOrderCart } from './AdminOrderCart';
import type { OrderOwner, AdminCartItem } from '@/lib/types/customers';
import type { OrderItem } from '@/lib/types/orders';
import { getAuth } from 'firebase/auth';
import { useCreateOrder, useOwnerSelection } from '@/hooks';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';

interface AdminOrderCreateProps {
  ownerSelection: ReturnType<typeof useOwnerSelection>;
}

export function AdminOrderCreate({ ownerSelection }: AdminOrderCreateProps) {
  const { t } = useTranslation();
  const { 
    owner, 
    isChangingOwner, 
    handleOwnerChange, 
    handleStartChange, 
    handleCancelChange,
    setOwner // we still need setOwner for reset in handleSave
  } = ownerSelection;
  
  const [cartItems, setCartItems] = useState<AdminCartItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { create, isLoading: creating } = useCreateOrder();

  // Add this new state for the expanded view
  const [expandedSection, setExpandedSection] = useState<'products' | 'cart' | null>(null);

  // Close expanded view on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpandedSection(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

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
        throw new Error(t('auth.signInRequired'));
      }

      const idempotencyKey = (globalThis as any).crypto?.randomUUID?.() ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

      await create({ payload: { owner, items, subtotal, total }, idToken, idempotencyKey });

      // Reset form or navigate after success
      setCartItems([]);
      setOwner(null);
      router.push('/admin/orders');
    } catch (e: any) {
      setError(e?.message || t('adminOrders.failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  const canProceed = owner !== null && cartItems.length > 0;

  return (
    <div className="space-y-6">
      {/* Owner Selection */}
      {!owner || isChangingOwner ? (
        <div className="space-y-2">
          {isChangingOwner && (
            <div className="flex justify-end">
              <button
                onClick={handleCancelChange}
                className="text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                {t('adminOrders.cancelChange')}
              </button>
            </div>
          )}
          <OwnerSelector selectedOwner={owner} onOwnerChange={handleOwnerChange} />
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border p-4 flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
          <div>
            <h3 className="uppercase text-xs opacity-50 font-bold mb-1">{t('adminOrders.orderFor')}</h3>
            <div className="font-medium">{owner.name || t('adminOrders.guest')}</div>
            <div className="text-sm text-muted-foreground">{owner.email}</div>
          </div>
          <button
            onClick={handleStartChange}
            className="text-sm text-primary hover:text-primary/80 hover:underline px-3 py-1"
          >
            {t('adminOrders.change')}
          </button>
        </div>
      )}

      {/* Only show the rest of the form if an owner is selected and we are not changing them */}
      {owner && !isChangingOwner && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
          
          {/* PRODUCT SELECTION SECTION */}
          <div 
            id="add-products-section" 
            className={cn(
              "transition-all duration-300 ease-in-out bg-background relative", // Added relative
              expandedSection === 'products' 
                ? "fixed inset-0 z-50 p-6 overflow-y-auto [&_.max-h-96]:max-h-[calc(100vh-160px)]" 
                : "border-t pt-6 scroll-mt-4"
            )}
          >
            {/* Controls positioned absolutely top-right */}
            <div className={cn("flex items-center gap-4 justify-end mb-2", expandedSection === 'products' ? "sticky top-0 z-10" : "absolute top-4 right-4 z-10")}>
               {!expandedSection && (
                   <button
                    onClick={() => {
                      document.getElementById('order-cart-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-sm text-primary hover:text-primary/80 hover:underline bg-card/80 backdrop-blur-sm px-2 py-1 rounded"
                  >
                    {t('adminOrders.goToCart')} ({cartItems.length})
                  </button>
                )}
                <button
                  onClick={() => setExpandedSection(expandedSection === 'products' ? null : 'products')}
                  className="p-2 hover:bg-muted rounded-full text-muted-foreground bg-card/80 backdrop-blur-sm shadow-sm border border-transparent hover:border-border transition-all"
                  title={expandedSection === 'products' ? t('adminOrders.exitFullscreen') : t('adminOrders.fullscreenMode')}
                >
                  {expandedSection === 'products' ? <Minimize2 size={20} /> : <Maximize2 size={16} />}
                </button>
            </div>

            {/* Product Selection */}
            <AdminProductPicker onAddToCart={handleAddToCart} />
          </div>

          {/* CART SECTION */}
          <div 
            id="order-cart-section" 
            className={cn(
              "transition-all duration-300 ease-in-out bg-background",
              expandedSection === 'cart' 
                ? "fixed inset-0 z-50 p-6 overflow-y-auto" 
                : "scroll-mt-4 relative"
            )}
          >
            {/* Header only visible when expanded or floating button when not */}
            <div className={cn("flex justify-end mb-2", expandedSection === 'cart' ? "sticky top-0 z-10" : "absolute top-4 right-4 z-10")}>
               <button
                  onClick={() => setExpandedSection(expandedSection === 'cart' ? null : 'cart')}
                  className="p-2 hover:bg-muted rounded-full text-muted-foreground bg-card/80 backdrop-blur-sm shadow-sm border border-transparent hover:border-border transition-all"
                  title={expandedSection === 'cart' ? t('adminOrders.exitFullscreen') : t('adminOrders.fullscreenCart')}
                >
                  {expandedSection === 'cart' ? <Minimize2 size={20} /> : <Maximize2 size={16} />}
               </button>
            </div>
            
            <AdminOrderCart
              items={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
            />
          </div>

          {/* Continue Button */}
          <div className="flex justify-end gap-4">
            <button
              onClick={() => {
                // If we are in expanded mode, close it first so we can scroll
                setExpandedSection(null);
                // Small timeout to allow render to settle before scrolling
                setTimeout(() => {
                  document.getElementById('add-products-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="px-6 py-3 border border-border text-foreground rounded-lg hover:bg-muted font-medium"
            >
              {t('adminOrders.addMoreProducts')}
            </button>
            <button
              onClick={handleSave}
              disabled={!canProceed || saving}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving || creating ? t('adminOrders.saving') : t('adminOrders.saveOrder')}
            </button>
          </div>

          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}

          {/* Debug Info (temporary) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-muted rounded text-xs font-mono">
              <div>Owner: {owner ? JSON.stringify(owner, null, 2) : 'None'}</div>
              <div>Cart Items: {cartItems.length}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
