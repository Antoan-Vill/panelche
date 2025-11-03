'use client';

import AuthGate from '@/components/AuthGate';
import { DashboardHeader } from '@/components/organisms/DashboardHeader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <DashboardHeader title="Admin" />
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </div>
    </AuthGate>
  );
}


