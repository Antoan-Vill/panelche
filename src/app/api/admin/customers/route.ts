export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';

const CreateCustomerSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).optional(),
});

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await getAuth().verifyIdToken(token);
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const emailFromToken = (decoded.email || '').toLowerCase();
    const isAdminClaim = (decoded as any).admin === true || (decoded as any).role === 'admin';
    const isAllowlisted = adminEmails.length > 0 && adminEmails.includes(emailFromToken);
    if (!isAdminClaim && !isAllowlisted) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body: z.infer<typeof CreateCustomerSchema>;
    try {
      const raw = await req.json();
      const parsed = CreateCustomerSchema.safeParse(raw);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
      }
      body = parsed.data;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const emailLower = body.email.trim().toLowerCase();
    const name = body.name?.trim() || null;

    const docRef = adminDb.collection('customers').doc(emailLower);
    const existing = await docRef.get();
    if (existing.exists) {
      const data = existing.data() as any;
      return NextResponse.json({ id: existing.id, email: data?.email || emailLower, name: data?.name ?? null }, { status: 200 });
    }

    await docRef.set({
      email: emailLower,
      name,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: docRef.id, email: emailLower, name }, { status: 201 });
  } catch (err) {
    console.error('Create customer error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



