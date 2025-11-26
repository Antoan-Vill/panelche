import { NextResponse } from 'next/server';
import type { Category } from './categories';
import type { ProductsResponse, ImageData, Variant } from './products';
import type { DashboardStats } from './stats';
import type { Customer } from './customers';

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: unknown;
  };
}

/**
 * API route handler return type
 */
export type ApiRouteResponse<T = unknown> = Promise<NextResponse<ApiResponse<T>>>;

/**
 * Firebase DecodedIdToken with custom claims
 */
export interface DecodedIdToken {
  uid: string;
  email?: string;
  admin?: boolean;
  role?: string;
  [key: string]: unknown;
}

/**
 * Firestore document data types
 */
export interface IdempotencyDoc {
  createdAt?: unknown;
  updatedAt?: unknown;
  orderId?: string;
  ownerId?: string;
}

export interface CustomerDoc {
  email: string;
  name?: string | null;
  createdAt?: unknown;
}

/**
 * Variant stock update response from CloudCart API
 */
export interface VariantStockUpdateResponse {
  data: {
    type: string;
    id: string;
    attributes: {
      quantity: number;
    };
  };
}



