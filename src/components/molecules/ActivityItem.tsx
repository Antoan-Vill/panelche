interface ActivityItemProps {
  status: string;
  time: string;
  dotColor?: string;
}

export function ActivityItem({ status, time, dotColor = 'bg-gray-400' }: ActivityItemProps) {
  return (
    <div className="flex items-center space-x-3">
      <div className={`w-2 h-2 ${dotColor} rounded-full`}></div>
      <div className="flex-1">
        <p className="text-sm text-foreground">{status}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}
