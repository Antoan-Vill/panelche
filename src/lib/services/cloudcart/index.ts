/**
 * CloudCart API Service Layer
 * 
 * Centralized service layer for all CloudCart API interactions.
 * Use these services in API routes and server-side code.
 */

export { getCloudCartClient, CloudCartClient } from './client';
export { cloudCartImages, CloudCartImagesService } from './images';
export { cloudCartCategories, CloudCartCategoriesService } from './categories';
export { cloudCartProducts, CloudCartProductsService } from './products';
export { cloudCartVariants, CloudCartVariantsService } from './variants';
export { cloudCartOrders, CloudCartOrdersService } from './orders';

// Re-export types for convenience
export type { GetCategoriesOptions, GetCategoriesResponse } from './categories';
export type { GetProductsOptions } from './products';
export type { GetOrdersOptions } from './orders';

