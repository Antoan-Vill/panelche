import Link from 'next/link';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';

interface ActionButtonProps {
  icon: string;
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'blue' | 'green' | 'yellow' | 'red';
}

export function ActionButton({ icon, label, onClick, href, variant = 'default' }: ActionButtonProps) {
  const buttonContent = (
    <>
      <Icon variant={variant} size="sm" className="mb-2">
        {icon}
      </Icon>
      <span className="text-sm font-medium text-foreground" title={label === 'Add User' ? 'Добави потребител' : label === 'View Sales' ? 'Виж продажби' : label === 'Manage Catalog' ? 'Управлявай каталог' : label === 'Settings' ? 'Настройки' : label === 'Reports' ? 'Отчети' : label}>{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href}>
        <div className="flex flex-col items-center p-4 border border-border rounded-lg hover:bg-muted transition-colors h-auto cursor-pointer">
          {buttonContent}
        </div>
      </Link>
    );
  }

  return (
    <Button
      variant="ghost"
      className="flex flex-col items-center p-4 border border-border rounded-lg hover:bg-muted transition-colors h-auto"
      onClick={onClick}
    >
      {buttonContent}
    </Button>
  );
}
