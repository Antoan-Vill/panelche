'use client';

import { DashboardTemplate } from '@/components/templates';
import { StatsSection, CategoriesSection, ActionsPanel, ActivityFeed } from '@/components/organisms';
import { useCategories, useDashboardStats } from '@/hooks';
import AuthGate from '@/components/AuthGate';

const actions = [
  {
    icon: '+',
    label: 'Add User',
    variant: 'blue' as const,
  },
  {
    icon: '$',
    label: 'View Sales',
    variant: 'green' as const,
  },
  {
    icon: '📦',
    label: 'Manage Catalog',
    href: '/admin/catalog',
    variant: 'blue' as const,
  },
  {
    icon: '⚙',
    label: 'Settings',
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

export default function Dashboard() {
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useCategories();
  const { stats, isLoading: statsLoading, error: statsError } = useDashboardStats();

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
