export const categoriesKeys = {
  all: ['categories'] as const,
  list: () => ['categories', 'list'] as const,
  bySlug: (slug: string) => ['categories', slug] as const,
  productsBySlug: (slug: string) => ['categories', slug, 'products'] as const,
};



