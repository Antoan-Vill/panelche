import { StatsCard } from './StatsCard';
import { getDashboardStats } from '@/lib/stats';

export async function StatsGrid() {
  const stats = await getDashboardStats();

  const statsData = [
    {
      title: 'Total Products',
      value: stats ? stats.totalProducts.toLocaleString() : '0',
      icon: '📦',
      iconBgColor: 'bg-blue-500',
      iconTextColor: 'text-white',
    },
    {
      title: 'Categories',
      value: stats ? stats.totalCategories.toLocaleString() : '0',
      icon: '📁',
      iconBgColor: 'bg-green-500',
      iconTextColor: 'text-white',
    },
    {
      title: 'In Stock',
      value: stats ? `${Math.round((stats.inStockProducts / 100) * 100)}%` : '0%',
      icon: '✅',
      iconBgColor: 'bg-yellow-500',
      iconTextColor: 'text-white',
    },
    {
      title: 'Active',
      value: stats ? `${stats.activeProducts}%` : '0%',
      icon: '🔥',
      iconBgColor: 'bg-red-500',
      iconTextColor: 'text-white',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat) => (
        <StatsCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          iconBgColor={stat.iconBgColor}
          iconTextColor={stat.iconTextColor}
        />
      ))}
    </div>
  );
}
