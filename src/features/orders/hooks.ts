'use client';

import { useCallback, useState } from 'react';
import type { OrderPayload } from '@/schemas/order';
import type { OrderOwner } from '@/lib/types/customers';

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

export function useOwnerSelection() {
  const [owner, setOwner] = useState<OrderOwner | null>(null);
  const [isChangingOwner, setIsChangingOwner] = useState(false);
  const [previousOwner, setPreviousOwner] = useState<OrderOwner | null>(null);

  const handleOwnerChange = useCallback((newOwner: OrderOwner | null) => {
    setOwner(newOwner);
    // Automatically exit change mode if a valid owner is selected
    if (newOwner) {
      setIsChangingOwner(false);
      setPreviousOwner(null); // Clear previous owner history on successful change
    }
  }, []);

  const handleStartChange = useCallback(() => {
    setPreviousOwner(owner);
    setIsChangingOwner(true);
  }, [owner]);

  const handleCancelChange = useCallback(() => {
    if (previousOwner) {
      setOwner(previousOwner);
    }
    setIsChangingOwner(false);
    setPreviousOwner(null);
  }, [previousOwner]);

  const resetOwner = useCallback(() => {
    setOwner(null);
    setIsChangingOwner(false);
    setPreviousOwner(null);
  }, []);

  return {
    owner,
    isChangingOwner,
    handleOwnerChange,
    handleStartChange,
    handleCancelChange,
    resetOwner,
    setOwner // exposing raw setter if needed, though handleOwnerChange covers it
  };
}
