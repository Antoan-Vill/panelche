'use client';

import AuthGate from '@/components/AuthGate';
import { DashboardHeader } from '@/components/organisms/DashboardHeader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <DashboardHeader title="Admin" />
        <main className="max-w-7xl mx-auto p-4">{children}</main>
      </div>
    </AuthGate>
  );
}


