export const revalidate = 300;

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cloudCartVariants } from '@/lib/services/cloudcart';
import { VariantSchema } from '@/schemas/variant';
import { badRequest, serverError, ok } from '@/lib/http/response';

const BodySchema = z.object({
  productIds: z.array(z.string().min(1)).min(1),
  concurrency: z.number().int().min(1).max(8).optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return badRequest('Invalid payload', parsed.error.flatten());
    }
    const { productIds, concurrency = 4 } = parsed.data;

    const queue = Array.from(new Set(productIds));
    const result: Record<string, unknown[]> = {};
    let index = 0;

    async function worker() {
      while (true) {
        const current = index;
        if (current >= queue.length) break;
        index += 1;
        const productId = queue[current];
        try {
          const variants = await cloudCartVariants.getByProductId(productId);
          // Validate each variant; keep only valid ones
          const validated = Array.isArray(variants)
            ? variants.filter((v: unknown) => VariantSchema.safeParse(v).success)
            : [];
          result[productId] = validated as unknown[];
        } catch {
          result[productId] = [];
        }
      }
    }

    const workers = Array.from({ length: Math.min(concurrency, queue.length) }, () => worker());
    await Promise.all(workers);
    return ok(result);
  } catch (e) {
    console.error('Error in batch variants route:', e);
    return serverError('Internal server error');
  }
}


