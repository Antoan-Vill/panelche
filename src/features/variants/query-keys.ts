export const variantsKeys = {
  all: ['variants'] as const,
  byProduct: (productId: string) => ['products', productId, 'variants'] as const,
  byVariant: (variantId: string) => ['variants', variantId] as const,
};



