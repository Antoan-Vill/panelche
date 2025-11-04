export const productsKeys = {
  all: ['products'] as const,
  byId: (id: string) => ['products', id] as const,
};



