export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';
import { cloudCartOrders } from '@/lib/services/cloudcart/orders';
import { mapCloudCartOrderToLocalOrder } from '@/lib/services/cloudcart/order-mapper';
import { badRequest, error as errorRes, ok, serverError } from '@/lib/http/response';
import type { ApiRouteResponse, DecodedIdToken } from '@/lib/types/api';
import { z } from 'zod';

// Schema for query parameters
const QuerySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.string().optional(),
});

type SyncStats = {
  totalFetched: number;
  newOrdersSaved: number;
  skippedDuplicates: number;
  failedOrders: number;
};

export async function POST(req: NextRequest): ApiRouteResponse<SyncStats> {
  try {
    // 1. Authentication Check (same as existing admin routes)
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return errorRes(401, 'Unauthorized');
    }

    const decoded = await getAuth().verifyIdToken(token);
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const email = (decoded.email || '').toLowerCase();
    const decodedWithClaims = decoded as DecodedIdToken;
    const isAdminClaim = decodedWithClaims.admin === true || decodedWithClaims.role === 'admin';
    const isAllowlisted = adminEmails.length > 0 && adminEmails.includes(email);
    
    if (!isAdminClaim && !isAllowlisted) {
      console.warn('orders_sync_forbidden', { email });
      return errorRes(403, 'Forbidden');
    }

    // 2. Parse Query Parameters
    let body;
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    
    const queryResult = QuerySchema.safeParse(body);
    if (!queryResult.success) {
      return badRequest('Invalid parameters', queryResult.error.flatten());
    }
    
    const { dateFrom, dateTo, limit, status } = queryResult.data;

    console.log('Starting CloudCart order sync', { dateFrom, dateTo, limit, status });

    // 3. Fetch Orders from CloudCart
    const ordersResponse = await cloudCartOrders.getOrders({
      page: 1,
      perPage: limit,
      dateFrom,
      dateTo,
      status,
    });

    const stats: SyncStats = {
      totalFetched: ordersResponse.data.length,
      newOrdersSaved: 0,
      skippedDuplicates: 0,
      failedOrders: 0,
    };

    // 4. Process Orders
    for (const orderSummary of ordersResponse.data) {
      try {
        // Check deduplication first
        const existingDocs = await adminDb
          .collection('orders')
          .where('externalOrderId', '==', orderSummary.id)
          .limit(1)
          .get();

        if (!existingDocs.empty) {
          stats.skippedDuplicates++;
          continue;
        }

        // Fetch full order details with items
        const fullOrder = await cloudCartOrders.getOrder(orderSummary.id);
        
        if (!fullOrder.items || fullOrder.items.length === 0) {
          console.warn(`Order ${orderSummary.id} has no items, skipping`);
          stats.failedOrders++;
          continue;
        }

        // Map to local format
        const orderData = mapCloudCartOrderToLocalOrder(fullOrder, fullOrder.items);

        // Save to Firestore
        await adminDb.collection('orders').add(orderData);
        stats.newOrdersSaved++;
        
      } catch (err) {
        console.error(`Error processing order ${orderSummary.id}:`, err);
        stats.failedOrders++;
      }
    }

    console.log('CloudCart order sync completed', stats);
    return ok(stats);

  } catch (err) {
    console.error('Sync orders error:', err);
    return serverError('Internal server error');
  }
}

