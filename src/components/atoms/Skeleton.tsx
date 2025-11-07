import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'rounded' | 'circular';
  animated?: boolean;
}

export function Skeleton({
  className,
  variant = 'default',
  animated = true,
  ...props
}: SkeletonProps) {
  const baseClasses = 'bg-muted';

  const variantClasses = {
    default: '',
    rounded: 'rounded-md',
    circular: 'rounded-full',
  };

  const animationClasses = animated ? 'animate-pulse' : '';

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], animationClasses, className)}
      {...props}
    />
  );
}

// Pre-built skeleton components for common use cases
export function SkeletonText({
  lines = 1,
  className,
  ...props
}: { lines?: number } & SkeletonProps) {
  if (lines === 1) {
    return <Skeleton className={cn('h-4 w-full', className)} {...props} />;
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full', // Last line is shorter
            className
          )}
          {...props}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 'md', className, ...props }: { size?: 'sm' | 'md' | 'lg' } & SkeletonProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return (
    <Skeleton
      variant="circular"
      className={cn(sizeClasses[size], className)}
      {...props}
    />
  );
}

export function SkeletonButton({ className, ...props }: SkeletonProps) {
  return <Skeleton className={cn('h-10 w-24 rounded-md', className)} {...props} />;
}

export function SkeletonCard({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-4', className)} {...props}>
      <div className="space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
  ...props
}: { rows?: number; columns?: number } & SkeletonProps) {
  return (
    <div className={cn('space-y-3', className)} {...props}>
      {/* Table header */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-4 flex-1" />
        ))}
      </div>

      {/* Table rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              className="h-4 flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 4, className, ...props }: { count?: number } & SkeletonProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6', className)} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} className="p-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}
