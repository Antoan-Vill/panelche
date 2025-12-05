'use client';

import { useRouter } from 'next/navigation';
import AuthGate from '@/components/AuthGate';
import { CartProvider } from '@/lib/cart/cart-context';
import { DashboardHeader } from '@/components/organisms/DashboardHeader';
import CartButton from '@/components/storefront/CartButton';
import { useTranslation } from '@/lib/i18n';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { t } = useTranslation();

  const handleCartClick = () => {
    router.push('/store/cart');
  };

  return (
    <AuthGate>
      <CartProvider>
        <div className="min-h-screen bg-background">
          <DashboardHeader
            title={t('store.title')}
            actions={[
              {
                label: <CartButton onClick={handleCartClick} />,
                onClick: handleCartClick,
              }
            ]}
          />
          <main className="max-w-6xl mx-auto px-4 py-6">
            {children}
          </main>
        </div>
      </CartProvider>
    </AuthGate>
  );
}


