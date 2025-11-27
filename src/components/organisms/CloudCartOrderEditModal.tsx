import React from 'react';
import type { OrderItem } from '@/lib/types/orders';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCloud } from '@fortawesome/free-solid-svg-icons';

type CloudCartOrderData = {
  id: string;
  attributes: {
    order_id: number;
    customer_first_name: string;
    customer_last_name: string;
    customer_email: string;
    customer_phone?: string;
    shipping_address?: {
      street: string;
      city: string;
      postcode: string;
      country: string;
    };
    payment_method?: string;
    shipping_method?: string;
    [key: string]: any;
  };
};

type Props = {
  order: {
    id: string;
    userId: string;
    status: string;
    total: number;
    subtotal: number;
    items: OrderItem[];
    createdAt: Date | null;
    source?: 'cloudcart' | 'manual';
    externalOrderId?: string;
    // We might need to fetch the full document to get cloudCartData if it's not in the list view
    // For now we'll assume we can pass what we have or fetch it
  };
  cloudCartData?: CloudCartOrderData;
  onClose: () => void;
};

export function CloudCartOrderEditModal({ order, cloudCartData, onClose }: Props) {
  // CloudCart orders should probably be read-only in terms of items/prices
  // to maintain sync integrity, but maybe allow status updates?

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={onClose}>
      <div 
        className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-4xl mx-4 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-blue-50/50 dark:bg-blue-900/10">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
              <FontAwesomeIcon icon={faCloud} />
            </div>
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                CloudCart Order #{order.externalOrderId || order.id}
              </h3>
              <p className="text-sm text-muted-foreground">
                Synced from CloudCart • {order.createdAt?.toLocaleString() || 'Unknown date'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-2 rounded hover:bg-muted/50">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Status & Customer Info Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Order Details</h4>
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="font-medium capitalize px-2 py-0.5 bg-white rounded border text-sm">
                    {order.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Internal ID</span>
                  <span className="font-mono text-xs">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">CloudCart ID</span>
                  <span className="font-mono text-sm">{order.externalOrderId}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Customer</h4>
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <div className="font-medium text-lg">
                  {cloudCartData?.attributes?.customer_first_name} {cloudCartData?.attributes?.customer_last_name}
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>{cloudCartData?.attributes?.customer_email || order.userId.replace('guest:', '')}</div>
                  {cloudCartData?.attributes?.customer_phone && (
                    <div>{cloudCartData.attributes.customer_phone}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Items ({order.items.length})</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium text-center">Qty</th>
                    <th className="px-4 py-3 font-medium text-right">Price</th>
                    <th className="px-4 py-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {order.items.map((item, i) => (
                    <tr key={i} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {item.sku && <span className="mr-2">SKU: {item.sku}</span>}
                          {item.variantId && <span>Var ID: {item.variantId}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">{item.unitPrice.toFixed(2)} лв</td>
                      <td className="px-4 py-3 text-right font-medium">{item.totalPrice.toFixed(2)} лв</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/50">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right font-medium">Subtotal</td>
                    <td className="px-4 py-3 text-right">{order.subtotal.toFixed(2)} лв</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right font-bold text-base">Total</td>
                    <td className="px-4 py-3 text-right font-bold text-base">{order.total.toFixed(2)} лв</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Raw Data Accordion (Optional for Debugging) */}
          {cloudCartData && (
            <div className="space-y-2">
              <details className="group">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground select-none">
                  View Raw CloudCart Data
                </summary>
                <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border overflow-x-auto">
                  <pre className="text-xs font-mono text-muted-foreground">
                    {JSON.stringify(cloudCartData, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-muted/10 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
          {/* Add actions here later if needed, e.g. "Sync Update" */}
        </div>
      </div>
    </div>
  );
}

