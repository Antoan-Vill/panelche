'use client';

import { AdminOrderCreate } from '@/components/organisms/AdminOrderCreate';
import { useOwnerSelection } from '@/hooks';
import { useTranslation } from '@/lib/i18n';

export default function AdminOrderCreatePage() {
  const { t } = useTranslation();
  const ownerSelection = useOwnerSelection();
  const { owner } = ownerSelection;

  return (
    <div className="max-w-7xl mx-auto">
      {!owner && (
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">{t('adminOrders.createNewOrder')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('adminOrders.createOrderDescription')}
          </p>
        </div>
      )}

      <AdminOrderCreate ownerSelection={ownerSelection} />
    </div>
  );
}
