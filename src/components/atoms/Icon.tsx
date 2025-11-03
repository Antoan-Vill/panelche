import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const iconVariants = cva('flex items-center justify-center rounded-md', {
  variants: {
    size: {
      sm: 'w-6 h-6',
      default: 'w-8 h-8',
      lg: 'w-10 h-10',
    },
    variant: {
      default: 'bg-muted text-muted-foreground',
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      red: 'bg-red-100 text-red-600',
      solid: 'bg-blue-500 text-white',
    },
  },
  defaultVariants: {
    size: 'default',
    variant: 'default',
  },
});

interface IconProps extends VariantProps<typeof iconVariants> {
  children: React.ReactNode;
  className?: string;
}

export function Icon({ children, size, variant, className }: IconProps) {
  return (
    <div className={cn(iconVariants({ size, variant }), className)}>
      <span className="text-sm font-bold">{children}</span>
    </div>
  );
}
