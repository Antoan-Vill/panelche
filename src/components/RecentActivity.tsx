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

export function RecentActivity() {
  return (
    <div className="bg-card rounded-lg shadow">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-lg font-medium text-foreground">Recent Activity</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className={`w-2 h-2 ${activity.dotColor} rounded-full`}></div>
              <div className="flex-1">
                <p className="text-sm text-foreground">{activity.status}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
