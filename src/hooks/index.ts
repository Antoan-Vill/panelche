// Re-export hooks from feature folders for backward compatibility
export { useCategories } from '@/features/categories/hooks';
export { useCategoryProducts } from '@/features/categories/hooks';
export { useDashboardStats } from '@/features/stats/hooks';
export { useProductVariants, useProductSearch } from '@/features/products/hooks';
export { useUpdateVariantStock } from '@/features/variants/mutations';
export { useCreateOrder, useOwnerSelection } from '@/features/orders/hooks';

// i18n hooks
export { useClientTranslation } from './useClientTranslation';
