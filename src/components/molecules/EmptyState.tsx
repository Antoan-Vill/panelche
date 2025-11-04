import Link from 'next/link';
import { FileX } from 'lucide-react';
import { buttonVariants } from '@/components/atoms/Button';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  action,
  icon = <FileX className="w-12 h-12 text-muted-foreground" />
}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="flex justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">{description}</p>
      {action && (
        <Link
          href={action.href}
          className={buttonVariants({ variant: 'default', size: 'default' })}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
