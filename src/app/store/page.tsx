'use client';

import { StoreOrderCreate } from '@/components/storefront/StoreOrderCreate';
import { useTranslation } from '@/lib/i18n';

export default function StoreHomePage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{t('store.shop')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('products.browseProducts')}
        </p>
      </div>

      <StoreOrderCreate />
    </div>
  );
}


