import { Card, CardHeader, CardContent, Heading } from '@/components/atoms';
import { ActionButton } from '@/components/molecules/ActionButton';

interface Action {
  icon: string;
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'blue' | 'green' | 'yellow' | 'red';
}

interface ActionsPanelProps {
  actions: Action[];
  title?: string;
}

export function ActionsPanel({ actions, title = 'Quick Actions' }: ActionsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <Heading level={2}>{title}</Heading>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {actions.map((action, index) => (
            <ActionButton
              key={index}
              icon={action.icon}
              label={action.label}
              onClick={action.onClick}
              href={action.href}
              variant={action.variant}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
