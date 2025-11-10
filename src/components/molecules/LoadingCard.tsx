import { Card, CardHeader, CardContent } from '@/components/atoms/Card';
import { Spinner } from '@/components/atoms/Spinner';

interface LoadingCardProps {
  title?: string;
  height?: string;
}

export function LoadingCard({ title = 'Loading...', height = 'h-32' }: LoadingCardProps) {
  return (
    <Card className={`${height} flex items-center justify-center`}>
      <div className="text-center">
        <Spinner className="mx-auto mb-2" />
        <p className="text-sm text-muted-foreground" title={title === 'Loading...' ? 'Зареждане...' : title === 'Loading categories...' ? 'Зареждане на категории...' : title}>{title}</p>
      </div>
    </Card>
  );
}
