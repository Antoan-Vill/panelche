'use client';

import { useCallback, useState } from 'react';
import type { OrderPayload } from '@/schemas/order';

type CreateOrderArgs = {
  payload: OrderPayload;
  idToken: string;
  idempotencyKey?: string;
};

type CreateOrderResult = {
  isLoading: boolean;
  error: string | null;
  create: (args: CreateOrderArgs) => Promise<{ id: string }>;
};

export function useCreateOrder(): CreateOrderResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async ({ payload, idToken, idempotencyKey }: CreateOrderArgs) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
          ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to create order');
      }
      const id = json?.data?.id ?? json?.id;
      if (!id) {
        throw new Error('Invalid response from server');
      }
      return { id };
    } catch (e: any) {
      setError(e?.message || 'Failed to create order');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, create };
}



