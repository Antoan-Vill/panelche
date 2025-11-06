'use client';

import { useEffect, useState } from 'react';
import { collectionGroup, getDocs, query, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { OrderItem } from '@/lib/types/orders';
import { deleteOrderForUser } from '@/lib/firebase/repositories/orders';
import { faPen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type OrderListItem = {
  id: string;
  userId: string;
  status: string;
  total: number;
  subtotal: number;
  items: OrderItem[];
  createdAt: Date | null;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ status: string; items: OrderItem[] } | null>(null);

  useEffect(() => {
    async function load() {
      setError(null);
      setLoading(true);
      try {
        const q = query(collectionGroup(db, 'orders'));
        const snap = await getDocs(q);
        const rows: OrderListItem[] = snap.docs.map((doc) => {
          const data: any = doc.data();
          const parentUserRef = doc.ref.parent?.parent;
          const userId = parentUserRef?.id ?? data.userId ?? 'unknown';
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : null;
          const items: OrderItem[] = Array.isArray(data.items) ? data.items.map((item: any) => ({
            productId: item.productId || '',
            productName: item.productName || '',
            sku: item.sku ?? null,
            variantId: item.variantId ?? null,
            quantity: Number(item.quantity) || 1,
            unitPrice: Number(item.unitPrice) || 0,
            totalPrice: Number(item.totalPrice) || 0,
            imageUrl: item.imageUrl ?? null,
          })) : [];
          return {
            id: doc.id,
            userId,
            status: data.status ?? 'pending',
            total: Number(data.total ?? 0),
            subtotal: Number(data.subtotal ?? 0),
            items,
            createdAt,
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
      if (confirm('Are you sure you want to delete this order?')) {
        const targetOrder = orders.find(o => o.id === deletingId);
        if (!targetOrder) return;
        deleteOrderForUser(targetOrder.userId, deletingId);
        setOrders(orders.filter(o => o.id !== deletingId));
        setDeletingId(null);
      }
    }
  }, [deletingId]);

  function startDelete(orderId: string) {
    setDeletingId(orderId);
  }
  function cancelDelete() {
    setDeletingId(null);
  }

  function startEdit(order: OrderListItem) {
    setEditingId(order.id);
    setEditForm({ status: order.status, items: [...order.items] });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
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
      const docRef = doc(db, 'users', targetOrder.userId, 'orders', orderId);
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

  return (
    <div>
      {/* Heading */}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">All Orders</h2>
        <a
          href="/admin/orders/create"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
        >
          Create Order
        </a>
      </div>
      {loading && <div className="text-muted-foreground">Loading…</div>}
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {!loading && !error && (
        <div className="overflow-auto border border-border rounded">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-3 py-2 border-b">Order ID</th>
                <th className="px-3 py-2 border-b">User ID</th>
                <th className="px-3 py-2 border-b">Status</th>
                <th className="px-3 py-2 border-b">Items</th>
                <th className="px-3 py-2 border-b">Subtotal</th>
                <th className="px-3 py-2 border-b">Total</th>
                <th className="px-3 py-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const isEditing = editingId === o.id;
                const currentItems = isEditing ? editForm?.items ?? [] : o.items;
                const { subtotal, total } = isEditing ? calculateTotals(currentItems) : { subtotal: o.subtotal, total: o.total };

                return (
                  <tr key={o.id} className="hover:bg-muted">
                    <td onClick={() => startEdit(o)} className="px-3 py-2 border-b font-mono">
                      <FontAwesomeIcon icon={faPen} className="me-2" /> 
                      {o.id}
                    </td>
                    <td className="px-3 py-2 border-b font-mono">{o.userId}</td>
                    <td className="px-3 py-2 border-b">
                      {isEditing ? (
                        <select
                          value={editForm?.status ?? o.status}
                          onChange={(e) => setEditForm(editForm ? { ...editForm, status: e.target.value } : null)}
                          className="border rounded px-2 py-1 text-xs"
                        >
                          <option value="pending">pending</option>
                          <option value="processing">processing</option>
                          <option value="completed">completed</option>
                          <option value="cancelled">cancelled</option>
                        </select>
                      ) : (
                        o.status
                      )}
                    </td>
                    <td className="px-3 py-2 border-b">
                      {isEditing ? (
                        <div className="space-y-1">
                          {currentItems.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs">
                              <span className="truncate max-w-32" title={item.productName}>{item.productName}</span>
                              <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(index, Number(e.target.value) || 1)}
                                className="border rounded px-1 py-0.5 text-xs w-12"
                              />
                              <span>× {item.unitPrice.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        `${o.items.length} item${o.items.length !== 1 ? 's' : ''}`
                      )}
                    </td>
                    <td className="px-3 py-2 border-b">{subtotal.toFixed(2)}</td>
                    <td className="px-3 py-2 border-b font-semibold">{total.toFixed(2)}</td>
                    <td className="px-3 py-2 border-b">
                      {isEditing ? (
                        <div className="flex gap-1">
                          <button onClick={() => saveEdit(o.id)} className="px-2 py-1 bg-green-600 text-white text-xs rounded">Save</button>
                          <button onClick={cancelEdit} className="px-2 py-1 bg-gray-600 text-white text-xs rounded">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <button onClick={() => startDelete(o.id)} className="px-2 py-1 bg-red-600 text-white text-xs rounded">Delete</button>
                          <span className="text-xs text-muted-foreground">{o.createdAt ? o.createdAt.toLocaleString() : '-'}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {orders.length === 0 && (
            <div className="p-4 text-muted-foreground">No orders found.</div>
          )}
        </div>
      )}
    </div>
  );
}


