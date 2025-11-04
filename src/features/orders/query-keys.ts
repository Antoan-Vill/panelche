export const ordersKeys = {
  all: ['orders'] as const,
  list: (ownerId?: string) => ownerId ? ['orders', 'list', ownerId] : ['orders', 'list'],
  detail: (orderId: string) => ['orders', 'detail', orderId],
};



