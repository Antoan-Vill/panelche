'use client';

import AuthGate from '@/components/AuthGate';
import { DashboardHeader } from '@/components/organisms/DashboardHeader';
import { useTranslation } from '@/lib/i18n';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <DashboardHeader title={t('admin.title')} />
        <main className="max-w-7xl mx-auto p-4">{children}</main>
      </div>
    </AuthGate>
  );
}


