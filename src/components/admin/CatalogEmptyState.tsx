'use client';

import { useTranslation } from '@/lib/i18n';

type CatalogEmptyStateProps = {
  type: 'no-category' | 'category-not-found' | 'no-products';
};

export function CatalogEmptyState({ type }: CatalogEmptyStateProps) {
  const { t } = useTranslation();

  if (type === 'no-category') {
    return (
      <div className="p-8 text-center">
        <svg className="mx-auto h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-foreground">{t('catalog.noCategorySelected')}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('catalog.chooseCategoryPrompt')}
        </p>
      </div>
    );
  }

  if (type === 'category-not-found') {
    return (
      <div className="p-8 text-center">
        <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-foreground">{t('catalog.categoryNotFound')}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('catalog.categoryNotFoundDesc')}
        </p>
      </div>
    );
  }

  if (type === 'no-products') {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('catalog.noProductsInCategory')}</p>
      </div>
    );
  }

  return null;
}
