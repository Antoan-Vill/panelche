// Legacy exports for backward compatibility - these are now re-exported from atomic folders
export { CategoryCard } from './molecules/CategoryCard';
export { Pagination } from './molecules/Pagination';
export { default as VariantStockManager } from './organisms/VariantStockManager';
export { default as VariantItem } from './molecules/VariantItem';
export { default as ProductVariants } from './organisms/ProductVariants';
export { CategoryDescription } from './molecules/CategoryDescription';
export { default as VariantsToggleButton } from './molecules/VariantsToggleButton';
export { default as CategoryList } from './admin/CategoryList';

// New atomic design exports
export * from './atoms';
export * from './molecules';
export * from './organisms';
export * from './templates';
