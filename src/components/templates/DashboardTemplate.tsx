import { DashboardHeader } from '@/components/organisms/DashboardHeader';

interface DashboardTemplateProps {
  children: React.ReactNode;
  headerTitle?: string;
  headerActions?: Array<{
    label: string;
    onClick?: () => void;
    variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  }>;
}

export function DashboardTemplate({
  children,
  headerTitle,
  headerActions
}: DashboardTemplateProps) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title={headerTitle} actions={headerActions} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}
