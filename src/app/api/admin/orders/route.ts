export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';
import type { OrderItem } from '@/lib/types/orders';
import type { OrderOwner } from '@/lib/types/customers';
import { FieldValue } from 'firebase-admin/firestore';
import { PayloadSchema, normalizeItems, computeTotalsCents, type ValidItem } from './validation';
import { badRequest, error as errorRes, ok, serverError } from '@/lib/http/response';
import type { ApiRouteResponse, DecodedIdToken, IdempotencyDoc } from '@/lib/types/api';

type Payload = {
  owner: OrderOwner;
  items: OrderItem[];
  subtotal: number;
  total: number;
};

export async function POST(req: Request): ApiRouteResponse<{ id: string }> {
  try {
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
      console.warn('orders_api_forbidden', { email, reason: 'not_admin' });
      return errorRes(403, 'Forbidden');
    }

    let body: Payload;
    try {
      const raw = await req.json();
      const parsed = PayloadSchema.safeParse(raw);
      if (!parsed.success) {
        console.warn('orders_api_invalid_payload', { issues: parsed.error.issues?.length ?? 0 });
        return badRequest('Invalid payload', parsed.error.flatten());
      }
      body = parsed.data as Payload;
    } catch {
      return badRequest('Invalid JSON payload');
    }

    const ownerId =
      body.owner.kind === 'customer'
        ? body.owner.customerId
        : `guest:${body.owner.email.toLowerCase()}`;

    // Normalize items and totals; compute integer cents
    const normalizedItems = normalizeItems(body.items as ValidItem[]);
    const totals = computeTotalsCents(normalizedItems);

    // Optional idempotency key support
    const idemKey = req.headers.get('idempotency-key') || null;
    if (idemKey) {
      const idemRef = adminDb.collection('idempotency').doc(idemKey);
      const existing = await idemRef.get();
      if (existing.exists) {
        const data = existing.data() as IdempotencyDoc;
        if (data?.orderId) {
          console.info('orders_api_idempotent_return', { idemKey });
          return ok({ id: data.orderId }, { status: 201 });
        }
      } else {
        await idemRef.set({ createdAt: FieldValue.serverTimestamp(), ownerId });
      }
    }

    const docRef = await adminDb
      .collection('orders')
      .add({
        userId: ownerId,
        status: 'pending',
        items: normalizedItems,
        subtotal: totals.subtotal,
        total: totals.total,
        subtotalCents: totals.subtotalCents,
        totalCents: totals.totalCents,
        createdAt: FieldValue.serverTimestamp(),
      });

    if (idemKey) {
      const idemRef = adminDb.collection('idempotency').doc(idemKey);
      await idemRef.set({ orderId: docRef.id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      console.info('orders_api_idempotent_set', { idemKey, orderId: docRef.id });
    }

    return ok({ id: docRef.id }, { status: 201 });
  } catch (err) {
    console.error('Create order error:', err);
    return serverError('Internal server error');
  }
}


