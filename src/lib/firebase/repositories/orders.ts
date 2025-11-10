'use client';

import { addDoc, collection, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { OrderDoc } from '@/lib/types/orders';

export async function createOrderForUser(userId: string, order: Omit<OrderDoc, 'createdAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'orders'), {
    ...order,
    userId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}


export async function deleteOrderForUser(userId: string, orderId: string): Promise<void> {
  await deleteDoc(doc(db, 'orders', orderId));
}