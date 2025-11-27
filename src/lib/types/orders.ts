export type OrderItem = {
  productId: string;
  productName: string;
  sku: string | null;
  variantId: string | null;
  quantity: number;
  unitPrice: number; // currency units (e.g., 9.99)
  unitPriceCents?: number; // cents (e.g., 999)
  totalPrice: number; // quantity * unitPrice
  totalPriceCents?: number; // cents
  angroPrice?: number; // quantity * angroPrice
  imageUrl: string | null;
  note: string;
};

export type OrderDoc = {
  userId: string;
  externalOrderId?: string; // CloudCart order ID
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  subtotalCents?: number;
  totalCents?: number;
  createdAt: unknown; // Firestore serverTimestamp
  source?: 'cloudcart' | 'manual';
  cloudCartData?: unknown; // Original CloudCart order object
};


