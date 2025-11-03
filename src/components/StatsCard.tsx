interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconBgColor: string;
  iconTextColor: string;
}

export function StatsCard({ title, value, icon, iconBgColor, iconTextColor }: StatsCardProps) {
  return (
    <div className="bg-card rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 ${iconBgColor} rounded-md flex items-center justify-center`}>
            <span className={`${iconTextColor} text-sm font-bold`}>{icon}</span>
          </div>
        </div>
        <div className="ml-4">
          <dt className="text-sm font-medium text-muted-foreground truncate">{title}</dt>
          <dd className="text-2xl font-semibold text-foreground">{value}</dd>
        </div>
      </div>
    </div>
  );
}
