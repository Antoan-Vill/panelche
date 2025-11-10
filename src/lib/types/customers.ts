export type Customer = { id: string; email: string; name?: string | null };

export type OrderOwner =
  | { kind: 'guest'; email: string; name?: string }
  | { kind: 'customer'; customerId: string; email: string; name?: string };

export type AdminCartItem = {
  productId: string;
  productName: string;
  variantId?: string | null;
  variantLabel?: string | null;
  imageUrl?: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number; // quantity * unitPrice
  sku: string | null;
  note: string;
};
