export type OrderItem = {
  productId: string;
  productName: string;
  sku: string | null;
  variantId: string | null;
  quantity: number;
  unitPrice: number; // currency units (e.g., 9.99)
  totalPrice: number; // quantity * unitPrice
  angroPrice: number; // quantity * angroPrice
  imageUrl: string | null;
};

export type OrderDoc = {
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  createdAt: unknown; // Firestore serverTimestamp
};


