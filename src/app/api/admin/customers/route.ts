export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { error, badRequest, serverError, ok } from '@/lib/http/response';
import type { ApiRouteResponse, DecodedIdToken, CustomerDoc } from '@/lib/types/api';
import type { Customer } from '@/lib/types/customers';

const CreateCustomerSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).optional(),
});

export async function POST(req: Request): ApiRouteResponse<Customer> {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return error(401, 'Unauthorized');
    }

    const decoded = await getAuth().verifyIdToken(token);
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const emailFromToken = (decoded.email || '').toLowerCase();
    const decodedWithClaims = decoded as DecodedIdToken;
    const isAdminClaim = decodedWithClaims.admin === true || decodedWithClaims.role === 'admin';
    const isAllowlisted = adminEmails.length > 0 && adminEmails.includes(emailFromToken);
    if (!isAdminClaim && !isAllowlisted) {
      return error(403, 'Forbidden');
    }

    let body: z.infer<typeof CreateCustomerSchema>;
    try {
      const raw = await req.json();
      const parsed = CreateCustomerSchema.safeParse(raw);
      if (!parsed.success) {
        return badRequest('Invalid payload', parsed.error.flatten());
      }
      body = parsed.data;
    } catch {
      return badRequest('Invalid JSON payload');
    }

    const emailLower = body.email.trim().toLowerCase();
    const name = body.name?.trim() || null;

    const docRef = adminDb.collection('customers').doc(emailLower);
    const existing = await docRef.get();
    if (existing.exists) {
      const data = existing.data() as CustomerDoc;
      return ok({ id: existing.id, email: data?.email || emailLower, name: data?.name ?? null });
    }

    await docRef.set({
      email: emailLower,
      name,
      createdAt: FieldValue.serverTimestamp(),
    });

    return ok({ id: docRef.id, email: emailLower, name });
  } catch (err) {
    console.error('Create customer error:', err);
    return serverError('Internal server error');
  }
}



