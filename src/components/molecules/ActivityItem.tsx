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
        <p className="text-sm text-foreground" title={status === 'New user registered' ? 'Нов потребител регистриран' : status === 'Order #1234 completed' ? 'Поръчка #1234 завършена' : status === 'Payment received' ? 'Плащане получено' : status}>{status}</p>
        <p className="text-xs text-muted-foreground" title={time.includes('minutes ago') ? time.replace('minutes ago', 'минути преди').replace('minute ago', 'минута преди') : time.includes('hours ago') ? time.replace('hours ago', 'часа преди').replace('hour ago', 'час преди') : time}>{time}</p>
      </div>
    </div>
  );
}
