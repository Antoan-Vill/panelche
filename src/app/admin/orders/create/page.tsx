'use client';

import { AdminOrderCreate } from '@/components/organisms/AdminOrderCreate';

export default function AdminOrderCreatePage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Create New Order</h1>
        <p className="text-muted-foreground mt-1">
          Select an order owner and add products to create a new order.
        </p>
      </div>

      <AdminOrderCreate />
    </div>
  );
}
