import { Icon } from '@/components/atoms/Icon';

interface StatItemProps {
  title: string;
  value: string | number;
  icon: string;
  iconVariant?: 'solid' | 'blue' | 'green' | 'yellow' | 'red';
}

export function StatItem({ title, value, icon, iconVariant = 'solid' }: StatItemProps) {
  return (
    <div className="bg-card rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon variant={iconVariant} size="sm">
            {icon}
          </Icon>
        </div>
        <div className="ml-4">
          <dt className="text-sm font-medium text-muted-foreground truncate" title={title === 'Total Products' ? 'Общо продукти' : title === 'Total Categories' ? 'Общо категории' : title === 'In Stock Products' ? 'Продукти на склад' : title === 'Active Products' ? 'Активни продукти' : title}>{title}</dt>
          <dd className="text-2xl font-semibold text-foreground">{value}</dd>
        </div>
      </div>
    </div>
  );
}
