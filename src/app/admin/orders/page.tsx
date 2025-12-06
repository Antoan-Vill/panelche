'use client';

import { useEffect, useState } from 'react';
import { collectionGroup, getDocs, query, doc, updateDoc, getDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { OrderItem } from '@/lib/types/orders';
import { deleteOrderForUser } from '@/lib/firebase/repositories/orders';
import { faPen, faPlus, faTrash, faSync, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getProductVariantsClient } from '@/lib/products';
import { useDataSource } from '@/lib/contexts/data-source-context';
import type { Product, Variant } from '@/lib/types/products';
import { VariantSelector } from '@/components/molecules/VariantSelector';
import { PriceList } from '@/components/molecules/PriceList';
import { SyncOptionsModal } from '@/components/organisms/SyncOptionsModal';
import { CloudCartOrderEditModal } from '@/components/organisms/CloudCartOrderEditModal';
import { useTranslation } from '@/lib/i18n';

type OrderListItem = {
  id: string;
  userId: string;
  status: string;
  total: number;
  subtotal: number;
  items: OrderItem[];
  createdAt: Date | null;
  source?: 'cloudcart' | 'manual';
  externalOrderId?: string;
};

// Product cache helpers (reused from AdminProductPicker)
const PRODUCTS_CACHE_KEY = 'av:productsCache:v1';
const PRODUCTS_CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12h

type CachedCategory = { updatedAt: number; products: Product[] };
type ProductsCache = Record<string, CachedCategory>;

function loadProductsCache(): ProductsCache {
  try {
    const raw = localStorage.getItem(PRODUCTS_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getAllCachedProducts(maxAgeMs = PRODUCTS_CACHE_TTL_MS): Product[] {
  const cache = loadProductsCache();
  return Object.values(cache).flatMap(entry => entry.products).filter(Boolean);
}

export default function AdminOrdersPage() {
  const { t } = useTranslation();
  const { source } = useDataSource();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [hideCloudCartOrders, setHideCloudCartOrders] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ status: string; items: OrderItem[] } | null>(null);
  const [viewingCloudCartOrder, setViewingCloudCartOrder] = useState<{ order: OrderListItem; data?: any } | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [itemSearchQueries, setItemSearchQueries] = useState<Record<number, string>>({});
  const [selectedProductIndex, setSelectedProductIndex] = useState<number | null>(null);
  const [itemVariants, setItemVariants] = useState<Record<number, Variant[]>>({});
  const [loadingVariants, setLoadingVariants] = useState<Record<number, boolean>>({});
  const [selectedProducts, setSelectedProducts] = useState<Record<number, Product>>({});

  useEffect(() => {
    async function load() {
      setError(null);
      setLoading(true);
      try {
        const q = query(collection(db, 'orders'));
        const snap = await getDocs(q);
        const rows: OrderListItem[] = snap.docs.map((doc) => {
          const data: any = doc.data();
          const userId = data.userId ?? 'unknown';
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : null;
          const items: OrderItem[] = Array.isArray(data.items) ? data.items.map((item: any) => ({
            productId: item.productId || '',
            productName: item.productName || '',
            sku: item.sku ?? null,
            variantId: item.variantId ?? null,
            quantity: Number(item.quantity) || 1,
            unitPrice: Number(item.unitPrice) || 0,
            totalPrice: Number(item.totalPrice) || 0,
            angroPrice: Number(item.angroPrice) || 0,
            imageUrl: item.imageUrl ?? null,
            note: item.note || '',
          })) : [];
          return {
            id: doc.id,
            userId,
            status: data.status ?? 'pending',
            total: Number(data.total ?? 0),
            subtotal: Number(data.subtotal ?? 0),
            items,
            createdAt,
            source: data.source,
            externalOrderId: data.externalOrderId,
          };
        });
        rows.sort((a, b) => {
          const at = a.createdAt ? a.createdAt.getTime() : 0;
          const bt = b.createdAt ? b.createdAt.getTime() : 0;
          return bt - at;
        });
        setOrders(rows);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (deletingId) {
      // confirm deletion
      if (confirm(t('orders.confirmDelete'))) {
        const targetOrder = orders.find(o => o.id === deletingId);
        if (!targetOrder) return;
        deleteOrderForUser(targetOrder.userId, deletingId);
        setOrders(orders.filter(o => o.id !== deletingId));
        if (editingId === deletingId) {
          setEditingId(null);
          setEditForm(null);
        }
        setDeletingId(null);
      }
    }
  }, [deletingId]);

  // Load products when modal opens
  useEffect(() => {
    if (!editingId) {
      setAllProducts([]);
      setItemSearchQueries({});
      setSelectedProductIndex(null);
      setItemVariants({});
      setLoadingVariants({});
      setSelectedProducts({});
      return;
    }

    const loadProducts = async () => {
      // Try cache first
      const cached = getAllCachedProducts();
      if (cached.length > 0) {
        setAllProducts(cached);
        return;
      }

      // Load from API if cache is empty
      setLoadingProducts(true);
      try {
        const res = await fetch(`/api/catalog?page=1&per_page=100&source=${source}`, {
          cache: 'no-store',
        });
        const json = await res.json();
        const products = Array.isArray(json.data) ? json.data : [];
        setAllProducts(products);
      } catch (e) {
        console.error('Error loading products:', e);
        setAllProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, [editingId, source]);

  function startDelete(orderId: string) {
    setDeletingId(orderId);
  }
  function cancelDelete() {
    setDeletingId(null);
  }

  function startEdit(order: OrderListItem) {
    if (order.source === 'cloudcart') {
      // Find full order data to get cloudCartData
      // In a real app we might need to fetch the single doc if it's not fully in the list
      // For now we'll rely on what we have, but if we need the original payload we should grab it
      // Let's quickly fetch the single doc to get the full `cloudCartData` field which might be large
      setLoading(true);
      getDoc(doc(db, 'orders', order.id)).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setViewingCloudCartOrder({
            order,
            data: data.cloudCartData
          });
        } else {
          setViewingCloudCartOrder({ order });
        }
      }).finally(() => setLoading(false));
      return;
    }
    setEditingId(order.id);
    setEditForm({ status: order.status, items: [...order.items] });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  function handleItemSearchChange(index: number, value: string) {
    setItemSearchQueries((prev) => ({ ...prev, [index]: value }));
    setSelectedProductIndex(null);
  }

  function handleProductSelect(index: number, product: Product, e?: React.MouseEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!editForm) return;

    // Immediately populate basic product info so item is no longer "empty"
    setEditForm((prevForm) => {
      if (!prevForm) return prevForm;
      const newItems = [...prevForm.items];
      newItems[index] = {
        ...newItems[index], // preserve any existing data
        productId: product.id,
        productName: product.attributes.name,
        imageUrl: product.attributes.image_url || null,
        // variantId, sku, unitPrice, quantity, totalPrice will be set by variant selection
      };
      return { ...prevForm, items: newItems };
    });
    
    setSelectedProductIndex(index);
    setSelectedProducts((prev) => ({ ...prev, [index]: product }));
    setItemSearchQueries((prev) => ({ ...prev, [index]: product.attributes.name }));

    // Load variants for the selected product
    setLoadingVariants((prev) => ({ ...prev, [index]: true }));
    getProductVariantsClient(product.id)
      .then((variants) => {
        setItemVariants((prev) => ({ ...prev, [index]: variants }));
        setLoadingVariants((prev) => ({ ...prev, [index]: false }));
      })
      .catch((error) => {
        console.error('Error loading variants:', error);
        setItemVariants((prev) => ({ ...prev, [index]: [] }));
        setLoadingVariants((prev) => ({ ...prev, [index]: false }));
      });
  }

  function handleVariantSelect(index: number, product: Product, payload: {
    selectedVariantId: string | null;
    quantity: number;
    unitPrice: number;
    sku: string | null;
  }) {
    setEditForm((prevForm) => {
      if (!prevForm) return prevForm;
      const newItems = [...prevForm.items];

      newItems[index] = {
        ...newItems[index], // preserve existing product data
        variantId: payload.selectedVariantId,
        sku: payload.sku,
        quantity: payload.quantity,
        unitPrice: payload.unitPrice,
        totalPrice: Number((payload.unitPrice * payload.quantity).toFixed(2)),
        angroPrice: 0,
      };

      return { ...prevForm, items: newItems };
    });

    setSelectedProductIndex(null);
    setItemSearchQueries((prev) => {
      const newQueries = { ...prev };
      delete newQueries[index];
      return newQueries;
    });
    setItemVariants((prev) => {
      const newVariants = { ...prev };
      delete newVariants[index];
      return newVariants;
    });
    setSelectedProducts((prev) => {
      const newSelected = { ...prev };
      delete newSelected[index];
      return newSelected;
    });
  }

  function getFilteredProductsForItem(index: number): Product[] {
    const query = itemSearchQueries[index] || '';
    if (query.trim().length <= 2) return [];
    const term = query.trim().toLowerCase();
    return allProducts.filter((product) =>
      product.attributes.name.toLowerCase().includes(term)
    );
  }

  function updateItemQuantity(index: number, quantity: number) {
    if (!editForm) return;
    const newItems = [...editForm.items];
    newItems[index] = {
      ...newItems[index],
      quantity: Math.max(1, quantity),
      totalPrice: Number((newItems[index].unitPrice * Math.max(1, quantity)).toFixed(2)),
    };
    setEditForm({ ...editForm, items: newItems });
  }

  function deleteItem(index: number) {
    if (!editForm) return;
    const newItems = [...editForm.items];
    newItems.splice(index, 1);
    setEditForm({ ...editForm, items: newItems });
  }

  function calculateTotals(items: OrderItem[]) {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const total = subtotal; // no shipping/taxes
    return { subtotal, total };
  }

  async function saveEdit(orderId: string) {
    if (!editForm) return;
    setError(null);
    try {
      // Check if user is authenticated
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      if (!auth.currentUser) {
        setError('You must be signed in to edit orders');
        return;
      }

      const targetOrder = orders.find(o => o.id === orderId);
      if (!targetOrder) return;
      const { subtotal, total } = calculateTotals(editForm.items);
      const docRef = doc(db, 'orders', orderId);
      await updateDoc(docRef, {
        status: editForm.status,
        items: editForm.items,
        subtotal,
        total,
      });
      // Update local state
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: editForm.status, items: editForm.items, subtotal, total } : o));
      setEditingId(null);
      setEditForm(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update order');
    }
  }

  async function handleSync(options: { limit: number; status?: string; dateFrom?: string; dateTo?: string }) {
    setSyncing(true);
    setError(null);
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      const res = await fetch('/api/admin/orders/sync-cloudcart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || 'Sync failed');
      }

      const data = await res.json();
      const stats = data.data;
      
      setShowSyncModal(false);
      alert(`Sync completed!\nFetched: ${stats.totalFetched}\nNew: ${stats.newOrdersSaved}\nSkipped: ${stats.skippedDuplicates}\nFailed: ${stats.failedOrders}`);
      
      // Reload orders
      setLoading(true);
      const q = query(collection(db, 'orders'));
      const snap = await getDocs(q);
      const rows: OrderListItem[] = snap.docs.map((doc) => {
        const data: any = doc.data();
        // ... same mapping as in useEffect ...
        const userId = data.userId ?? 'unknown';
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : null;
        const items: OrderItem[] = Array.isArray(data.items) ? data.items.map((item: any) => ({
          productId: item.productId || '',
          productName: item.productName || '',
          sku: item.sku ?? null,
          variantId: item.variantId ?? null,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          totalPrice: Number(item.totalPrice) || 0,
          angroPrice: Number(item.angroPrice) || 0,
          imageUrl: item.imageUrl ?? null,
          note: item.note || '',
        })) : [];
        return {
          id: doc.id,
          userId,
          status: data.status ?? 'pending',
          total: Number(data.total ?? 0),
          subtotal: Number(data.subtotal ?? 0),
          items,
          createdAt,
          source: data.source,
          externalOrderId: data.externalOrderId,
        };
      });
      rows.sort((a, b) => {
        const at = a.createdAt ? a.createdAt.getTime() : 0;
        const bt = b.createdAt ? b.createdAt.getTime() : 0;
        return bt - at;
      });
      setOrders(rows);
      setLoading(false);

    } catch (e) {
      console.error('Sync error:', e);
      setError(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div>
      {/* Heading */}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{t('orders.allOrders')}</h2>
        <div className="flex gap-2">
          {/* <button
            onClick={() => setHideCloudCartOrders(!hideCloudCartOrders)}
            className={`px-4 py-2 rounded text-sm font-medium flex items-center gap-2 border ${
              hideCloudCartOrders 
                ? 'bg-muted text-muted-foreground border-border'
                : 'bg-card text-foreground border-border hover:bg-muted/50'
            }`}
          >
            <FontAwesomeIcon icon={hideCloudCartOrders ? faEyeSlash : faEye} />
            {hideCloudCartOrders ? t('orders.hiddenCloudCart') : t('orders.hideCloudCart')}
          </button>
          <button
            onClick={() => setShowSyncModal(true)}
            disabled={syncing || loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faSync} className={syncing ? 'fa-spin' : ''} />
            {syncing ? t('orders.syncing') : t('orders.syncCloudCart')}
          </button> */}
          <a
            href="/admin/orders/create"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
          >
            {t('orders.create')}
          </a>
        </div>
      </div>
      {loading && <div className="text-muted-foreground">{t('loading')}</div>}
      {error && <div className="text-red-600 text-sm" title={error}>{error}</div>}
      {!loading && !error && (
        <div className="overflow-auto border border-border rounded">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-3 py-2 border-b">{t('orders.orderId')}</th>
                <th className="px-3 py-2 border-b">{t('orders.userId')}</th>
                <th className="px-3 py-2 border-b">{t('orders.status')}</th>
                <th className="px-3 py-2 border-b">{t('orders.source')}</th>
                <th className="px-3 py-2 border-b">{t('orders.items')}</th>
                <th className="px-3 py-2 border-b">{t('orders.subtotal')}</th>
                <th className="px-3 py-2 border-b">{t('orders.total')}</th>
                <th className="px-3 py-2 border-b">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {orders
                .filter(o => !hideCloudCartOrders || o.source !== 'cloudcart')
                .map((o) => {
                const isEditing = editingId === o.id;
                const currentItems = isEditing ? editForm?.items ?? [] : o.items;
                const { subtotal, total } = isEditing ? calculateTotals(currentItems) : { subtotal: o.subtotal, total: o.total };

                return (
                  <tr key={o.id} className="hover:bg-muted">
                    <td onClick={() => startEdit(o)} className="px-3 py-2 border-b font-mono">
                      <FontAwesomeIcon icon={faPen} className="me-2" /> 
                      {o.id}
                      {o.externalOrderId && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {t('orders.externalId')}: {o.externalOrderId}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 border-b font-mono">{o.userId}</td>
                    <td className="px-3 py-2 border-b">
                      {o.status}
                    </td>
                    <td className="px-3 py-2 border-b">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        o.source === 'cloudcart' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {o.source === 'cloudcart' ? 'CloudCart' : t('orders.manual')}
                      </span>
                    </td>
                    <td className="px-3 py-2 border-b">
                      {`${o.items.length} ${o.items.length !== 1 ? t('orders.itemsPlural') : t('orders.item')}`}
                    </td>
                    <td className="px-3 py-2 border-b">{subtotal.toFixed(2)} лв</td>
                    <td className="px-3 py-2 border-b font-semibold">{total.toFixed(2)} лв</td>
                    <td className="px-3 py-2 border-b">
                      <span className="text-xs text-muted-foreground">{o.createdAt ? o.createdAt.toLocaleString() : '-'}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {orders.length === 0 && (
            <div className="p-4 text-muted-foreground">{t('orders.noOrders')}</div>
          )}
        </div>
      )}
      {/* Sync Modal */}
      <SyncOptionsModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        onSync={handleSync}
        isSyncing={syncing}
      />

      {/* CloudCart View Modal */}
      {viewingCloudCartOrder && (
        <CloudCartOrderEditModal
          order={viewingCloudCartOrder.order}
          cloudCartData={viewingCloudCartOrder.data}
          onClose={() => setViewingCloudCartOrder(null)}
        />
      )}

      {/* Edit Modal (Manual Orders) */}
      {editingId && editForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={cancelEdit}>
          <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl mx-4 border border-border" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t('orders.editOrder')} <span className="font-mono">{editingId}</span></h3>
              <button onClick={cancelEdit} className="px-2 py-1 text-sm rounded hover:bg-muted">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-sm w-24">{t('orders.status')}</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="pending">pending</option>
                  <option value="processing">processing</option>
                  <option value="completed">completed</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>

              <div className="space-y-2 bg-muted p-4 border border-border rounded">
                <div className="text-sm font-medium">{t('orders.items')}</div>
                <div className="divide-y">
                  {editForm.items.map((item, index) => {
                    const isEmpty = !item.productName || item.productName.trim() === '';
                    const searchQuery = itemSearchQueries[index] || '';
                    const isSelectingProduct = !!selectedProducts[index];
                    const filteredProductsForItem = getFilteredProductsForItem(index);
                    const variants = itemVariants[index] || [];
                    const isLoadingVariants = loadingVariants[index] || false;

                    if (isEmpty) {
                      return (
                        <div key={index} className="py-3 space-y-2">
                          <div className="relative">
                            <input
                              type="text"
                              placeholder={t('products.searchProduct')}
                              value={searchQuery}
                              onChange={(e) => handleItemSearchChange(index, e.target.value)}
                              onBlur={() => {
                                // Delay hiding dropdown to allow click events to fire
                                setTimeout(() => {
                                  setSelectedProductIndex(null);
                                }, 200);
                              }}
                              className="w-full border rounded px-2 py-1 text-sm"
                              autoFocus
                            />
                            {searchQuery && filteredProductsForItem.length > 0 && (
                              <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded shadow-lg max-h-60 overflow-y-auto">
                                {filteredProductsForItem.map((product) => (
                                  <button
                                    key={product.id}
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleProductSelect(index, product, e);
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-muted text-sm cursor-pointer"
                                  >
                                    {product.attributes.name}
                                  </button>
                                ))}
                              </div>
                            )}
                            {searchQuery && filteredProductsForItem.length === 0 && searchQuery.trim().length > 2 && (
                              <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded shadow-lg px-3 py-2 text-sm text-muted-foreground">
                                <span>{t('products.noProducts')}</span>
                              </div>
                            )}
                          </div>
                          {isSelectingProduct && (
                            <div className="pl-2 border-l-2 border-blue-500">
                              {/* Show all prices for reference */}
                              {selectedProducts[index]?.attributes.prices && selectedProducts[index].attributes.prices.length > 0 && (
                                <div className="mb-2">
                                  <PriceList 
                                    prices={selectedProducts[index].attributes.prices} 
                                    inCents={source !== 'firestore'}
                                    compact 
                                  />
                                </div>
                              )}
                              {isLoadingVariants ? (
                                <div className="text-sm text-muted-foreground py-2">{t('products.loadingVariants')}</div>
                              ) : selectedProducts[index] ? (
                                <VariantSelector
                                  variants={variants}
                                  priceCents={selectedProducts[index]?.attributes.price ?? null}
                                  baseSku={selectedProducts[index]?.attributes.sku ?? null}
                                  onAdd={(payload) => handleVariantSelect(index, selectedProducts[index]!, payload)}
                                />
                              ) : null}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div key={index} className="py-2 space-y-2">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <div className="min-w-0 flex-1">
                            <div className="truncate" title={item.productName}>{item.productName}</div>
                            {item.sku && <div className="text-xs text-muted-foreground" title="SKU">SKU: {item.sku}</div>}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity || 1}
                              onChange={(e) => updateItemQuantity(index, Number(e.target.value) || 1)}
                              className="border rounded px-2 py-1 text-sm w-20 text-right"
                            />
                            <div className="w-28 text-right tabular-nums text-xs">
                              {item.unitPrice ? `${item.unitPrice.toFixed(2)} лв` : '-'}
                            </div>
                            <div className="w-28 text-right font-medium tabular-nums">
                              {item.totalPrice ? `${item.totalPrice.toFixed(2)} лв` : '-'}
                            </div>
                            <div onClick={() => deleteItem(index)} className="w-28 text-right font-medium tabular-nums cursor-pointer">
                              <FontAwesomeIcon icon={faTrash} className="me-2" />
                            </div>
                          </div>
                        </div>
                        {/* Show variant selector if item has product but missing variant details */}
                        {isSelectingProduct && (!item.quantity || !item.unitPrice) && (
                          <div className="pl-4 border-l-2 border-blue-500">
                            {isLoadingVariants ? (
                              <div className="text-sm text-muted-foreground py-2">{t('products.loadingVariants')}</div>
                            ) : selectedProducts[index] ? (
                              <VariantSelector
                                variants={variants}
                                priceCents={selectedProducts[index]?.attributes.price ?? null}
                                baseSku={selectedProducts[index]?.attributes.sku ?? null}
                                onAdd={(payload) => handleVariantSelect(index, selectedProducts[index]!, payload)}
                              />
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-8 text-sm">
                {(() => {
                  const totals = calculateTotals(editForm.items);
                  return (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{t('orders.subtotal')}</span>
                        <span className="font-medium tabular-nums">{totals.subtotal.toFixed(2)} лв</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{t('orders.total')}</span>
                        <span className="font-semibold tabular-nums">{totals.total.toFixed(2)} лв</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
            {/* add more items */}
            <div className="p-4 flex justify-end">
              <button onClick={() => setEditForm({ ...editForm, items: [...editForm.items, { productId: '', productName: '', sku: '', variantId: '', quantity: 1, unitPrice: 0, totalPrice: 0, imageUrl: '', angroPrice: 0, note: '' }] })} className="px-3 py-2 bg-blue-600 text-white text-sm rounded">
                <FontAwesomeIcon icon={faPlus} className="me-1" />
                <span>{t('orders.addMoreItems')}</span>
              </button>  
            </div>
            <div className="p-4 border-t flex items-center justify-between">
              <button onClick={() => editingId && startDelete(editingId)} className="px-3 py-2 bg-red-600 text-white text-sm rounded">
                <FontAwesomeIcon icon={faTrash} className="me-1" />
                {t('delete')}
              </button>
              <div className="flex gap-2">
                <button onClick={cancelEdit} className="px-3 py-2 bg-muted text-foreground text-sm rounded">{t('cancel')}</button>
                <button onClick={() => saveEdit(editingId)} className="px-3 py-2 bg-green-600 text-white text-sm rounded">{t('orders.saveChanges')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


