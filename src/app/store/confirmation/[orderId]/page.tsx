'use client';

import { use } from 'react';
import { useTranslation } from '@/lib/i18n';

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default function ConfirmationPage({ params }: PageProps) {
  const { orderId } = use(params);
  const { t } = useTranslation();

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold mb-2">{t('orders.orderReceived')}</h1>
      <p className="text-muted-foreground">{t('orders.orderSuccessMessage')}</p>
      <div className="mt-4 p-4 bg-muted border border-border rounded">
        <div className="text-sm text-muted-foreground">{t('orders.orderId')}</div>
        <div className="font-mono text-sm">{orderId}</div>
      </div>
    </div>
  );
}


