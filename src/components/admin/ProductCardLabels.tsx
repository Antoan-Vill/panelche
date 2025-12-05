'use client';

import { useTranslation } from '@/lib/i18n';

export function PriceNotAvailable() {
  const { t } = useTranslation();
  return (
    <p className="text-sm text-muted-foreground mb-2">{t('products.priceNotAvailable')}</p>
  );
}

export function StockLabel({ quantity }: { quantity: number }) {
  const { t } = useTranslation();
  return (
    <p className="text-sm text-muted-foreground">
      {t('products.stock')}: {quantity}
    </p>
  );
}
