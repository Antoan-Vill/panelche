const actions = [
  {
    icon: '+',
    label: 'Add User',
    iconBgColor: 'bg-blue-100',
    iconTextColor: 'text-blue-600',
  },
  {
    icon: '$',
    label: 'View Sales',
    iconBgColor: 'bg-green-100',
    iconTextColor: 'text-green-600',
  },
  {
    icon: '⚙',
    label: 'Settings',
    iconBgColor: 'bg-yellow-100',
    iconTextColor: 'text-yellow-600',
  },
  {
    icon: '📊',
    label: 'Reports',
    iconBgColor: 'bg-red-100',
    iconTextColor: 'text-red-600',
  },
];

export function QuickActions() {
  return (
    <div className="bg-card rounded-lg shadow">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-lg font-medium text-foreground" title="Бързи действия">Quick Actions</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {actions.map((action, index) => (
            <button
              key={index}
              className="flex flex-col items-center p-4 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <div className={`w-8 h-8 ${action.iconBgColor} rounded-md flex items-center justify-center mb-2`}>
                <span className={`${action.iconTextColor} text-sm font-bold`}>{action.icon}</span>
              </div>
              <span className="text-sm font-medium text-foreground" title={action.label === 'Add User' ? 'Добави потребител' : action.label === 'View Sales' ? 'Виж продажби' : action.label === 'Settings' ? 'Настройки' : action.label === 'Reports' ? 'Отчети' : action.label}>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
