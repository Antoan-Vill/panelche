import type { DashboardStats } from '@/lib/types/stats';
import { StatItem } from '@/components/molecules/StatItem';
import { ErrorMessage } from '@/components/atoms/ErrorMessage';
import { SkeletonStats } from '@/components/atoms/Skeleton';

interface StatsSectionProps {
  stats: DashboardStats | null;
  isLoading?: boolean;
  error?: string | null;
}

export function StatsSection({ stats, isLoading = false, error }: StatsSectionProps) {
  if (isLoading) {
    return <SkeletonStats className="mb-8" />;
  }

  if (error) {
    return (
      <div className="mb-8">
        <ErrorMessage message={`Failed to load dashboard statistics: ${error}`} />
      </div>
    );
  }

  const statsData = [
    {
      title: 'Total Products',
      value: stats?.totalProducts != null ? stats.totalProducts.toLocaleString() : '0',
      icon: 'P',
      iconVariant: 'solid' as const,
    },
    {
      title: 'Total Categories',
      value: stats?.totalCategories != null ? stats.totalCategories.toLocaleString() : '0',
      icon: 'C',
      iconVariant: 'blue' as const,
    },
    {
      title: 'In Stock Products',
      value: stats?.inStockProducts != null ? stats.inStockProducts.toLocaleString() : '0',
      icon: 'S',
      iconVariant: 'green' as const,
    },
    {
      title: 'Active Products',
      value: stats?.activeProducts != null ? `${stats.activeProducts}%` : '0%',
      icon: 'A',
      iconVariant: 'yellow' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat) => (
        <StatItem
          key={stat.title}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          iconVariant={stat.iconVariant}
        />
      ))}
    </div>
  );
}
