import { z } from 'zod';

const OwnerGuestSchema = z.object({
  kind: z.literal('guest'),
  email: z.string().email(),
  name: z.string().trim().min(1).optional(),
});

const OwnerCustomerSchema = z.object({
  kind: z.literal('customer'),
  customerId: z.string().min(1),
  email: z.string().email(),
  name: z.string().trim().min(1).optional(),
});

export const OwnerSchema = z.union([OwnerGuestSchema, OwnerCustomerSchema]);

const ItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  sku: z.string().min(1).nullable().optional(),
  variantId: z.string().min(1).nullable().optional(),
  quantity: z.number().int().min(1).max(100000),
  unitPrice: z.number().finite().min(0),
  totalPrice: z.number().finite().min(0).optional(),
  imageUrl: z.string().url().nullable().optional(),
});

export const PayloadSchema = z.object({
  owner: OwnerSchema,
  items: z.array(ItemSchema).min(1).max(500),
  subtotal: z.number().finite().min(0).optional(),
  total: z.number().finite().min(0).optional(),
});

export type ValidOwner = z.infer<typeof OwnerSchema>;
export type ValidItem = z.infer<typeof ItemSchema>;
export type ValidPayload = z.infer<typeof PayloadSchema>;

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function normalizeItems(items: ValidItem[]) {
  return items.map((i) => {
    const unitPrice = Number(i.unitPrice || 0);
    const quantity = Number(i.quantity || 0);
    const total = unitPrice * quantity;
    const totalPrice = Number(total.toFixed(2));
    return {
      productId: i.productId,
      productName: i.productName,
      sku: i.sku ?? null,
      variantId: i.variantId ?? null,
      quantity,
      unitPrice,
      unitPriceCents: toCents(unitPrice),
      totalPrice,
      totalPriceCents: toCents(totalPrice),
      imageUrl: i.imageUrl ?? null,
    };
  });
}

export function computeTotalsCents(items: ReturnType<typeof normalizeItems>) {
  const subtotalCents = items.reduce((sum, i) => sum + (i.totalPriceCents || 0), 0);
  return {
    subtotalCents,
    totalCents: subtotalCents, // no taxes/shipping yet
    subtotal: Number((subtotalCents / 100).toFixed(2)),
    total: Number((subtotalCents / 100).toFixed(2)),
  };
}


