'use client';

import { DashboardTemplate } from '@/components/templates';
import { StatsSection, CategoriesSection, ActionsPanel, ActivityFeed } from '@/components/organisms';
import { useCategories, useDashboardStats } from '@/hooks';
import AuthGate from '@/components/AuthGate';
import { useTranslation } from '@/lib/i18n';
import { useDataSource } from '@/lib/contexts/data-source-context';

export default function Dashboard() {
  const { t } = useTranslation();
  const { source } = useDataSource();
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useCategories(source);
  const { stats, isLoading: statsLoading, error: statsError } = useDashboardStats();

  const actions = [
    {
      icon: '+',
      label: t('actions.addUser'),
      variant: 'blue' as const,
    },
    {
      icon: '$',
      label: t('actions.viewSales'),
      variant: 'green' as const,
    },
    {
      icon: '📦',
      label: t('actions.manageCatalog'),
      href: '/admin/catalog',
      variant: 'blue' as const,
    },
    {
      icon: '⚙',
      label: t('actions.settings'),
      variant: 'yellow' as const,
    },
  ];

  const activities = [
    {
      status: 'New user registered',
      time: '2 minutes ago',
      dotColor: 'bg-green-500',
    },
    {
      status: 'Order #1234 completed',
      time: '5 minutes ago',
      dotColor: 'bg-blue-500',
    },
    {
      status: 'Payment received',
      time: '10 minutes ago',
      dotColor: 'bg-yellow-500',
    },
  ];

  return (
    <AuthGate>
      <DashboardTemplate>
        <StatsSection
          stats={stats}
          isLoading={statsLoading}
          error={statsError}
        />
        <CategoriesSection
          categories={categories || []}
          isLoading={categoriesLoading}
          error={categoriesError}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityFeed activities={activities} />
          <ActionsPanel actions={actions} />
        </div>
      </DashboardTemplate>
    </AuthGate>
  );
}
