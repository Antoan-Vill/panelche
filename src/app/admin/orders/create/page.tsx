'use client';

import { AdminOrderCreate } from '@/components/organisms/AdminOrderCreate';
import { useOwnerSelection } from '@/hooks';

export default function AdminOrderCreatePage() {
  const ownerSelection = useOwnerSelection();
  const { owner } = ownerSelection;

  return (
    <div className="max-w-7xl mx-auto">
      {!owner && (
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Create New Order</h1>
          <p className="text-muted-foreground mt-1">
            Select an order owner and add products to create a new order.
          </p>
        </div>
      )}

      <AdminOrderCreate ownerSelection={ownerSelection} />
    </div>
  );
}
