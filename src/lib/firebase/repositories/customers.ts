import { collection, doc, getDoc, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { Customer } from '@/lib/types/customers';

export async function searchCustomersByEmailPrefix(prefix: string): Promise<Customer[]> {
  try {
    const customersRef = collection(db, 'customers');
    const q = query(
      customersRef,
      where('email', '>=', prefix),
      where('email', '<', prefix + '\uf8ff'),
      limit(10)
    );
    const snap = await getDocs(q);
    console.log('snap', snap.docs.map((doc) => doc.data()));
    return snap.docs.map((doc) => ({
      id: doc.id,
      email: doc.data().email,
      name: doc.data().name || null,
    }));
  } catch (error) {
    console.error('Error searching customers:', error);
    return [];
  }
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  try {
    const docRef = doc(db, 'customers', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return null;
    }
    const data = snap.data();
    return {
      id: snap.id,
      email: data.email,
      name: data.name || null,
    };
  } catch (error) {
    console.error('Error getting customer:', error);
    return null;
  }
}
