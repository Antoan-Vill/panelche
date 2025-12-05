'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart/cart-context';
import { useAuth } from '@/lib/firebase/auth-context';
import { createOrderForUser } from '@/lib/firebase/repositories/orders';
import { useTranslation } from '@/lib/i18n';

export default function CheckoutPage() {
  const { items, subtotal, total, clear } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postal, setPostal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-populate from authenticated user
  useEffect(() => {
    if (user) {
      if (!name) setName(user.displayName ?? '');
      if (!email) setEmail(user.email ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!user) {
      setError(t('auth.signInRequired'));
      return;
    }
    if (items.length === 0) {
      setError(t('store.cartEmpty'));
      return;
    }
    if (!name || !email) {
      setError(t('auth.provideNameEmail'));
      return;
    }

    setLoading(true);
    try {
      const orderId = await createOrderForUser(user.uid, {
        userId: user.uid,
        status: 'pending',
        items,
        subtotal,
        total,
      });
      clear();
      router.push(`/store/confirmation/${orderId}`);
    } catch (err) {
      setError(t('orders.orderFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">{t('checkout.title')}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('checkout.fullName')} *</label>
          <input className="w-full border rounded px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('checkout.email')} *</label>
          <input type="email" className="w-full border rounded px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('checkout.phoneOptional')}</label>
          <input className="w-full border rounded px-3 py-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('checkout.addressOptional')}</label>
          <input className="w-full border rounded px-3 py-2" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('checkout.cityOptional')}</label>
            <input className="w-full border rounded px-3 py-2" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('checkout.postalCodeOptional')}</label>
            <input className="w-full border rounded px-3 py-2" value={postal} onChange={(e) => setPostal(e.target.value)} />
          </div>
        </div>

        <div className="pt-2 text-sm text-muted-foreground">{t('checkout.total')}: <span className="font-semibold">{total.toFixed(2)}</span></div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button
          type="submit"
          disabled={loading || items.length === 0}
          className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? t('orders.placingOrder') : t('orders.placeOrder')}
        </button>
      </form>
    </div>
  );
}


