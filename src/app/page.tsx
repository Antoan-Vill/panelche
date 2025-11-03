import { DashboardTemplate } from '@/components/templates';
import { StatsSection, CategoriesSection, ActionsPanel, ActivityFeed } from '@/components/organisms';
import { getCategories } from '@/lib/categories';
import { getDashboardStats } from '@/lib/stats';
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
    label: 'Manage Products',
    href: '/admin/products',
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

export default async function Dashboard() {
  const [categories, stats] = await Promise.all([
    getCategories(),
    getDashboardStats(),
  ]);

  return (
    <AuthGate>
      <DashboardTemplate>
        <StatsSection
          stats={stats}
          isLoading={false}
          error={null}
        />
        <CategoriesSection
          categories={categories}
          isLoading={false}
          error={null}
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
