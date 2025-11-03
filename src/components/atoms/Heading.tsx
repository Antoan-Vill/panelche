import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const headingVariants = cva('', {
  variants: {
    level: {
      1: 'text-2xl font-bold text-foreground',
      2: 'text-lg font-medium text-foreground',
      3: 'text-base font-medium text-foreground',
      4: 'text-sm font-medium text-foreground',
    },
  },
  defaultVariants: {
    level: 1,
  },
});

interface HeadingProps extends VariantProps<typeof headingVariants> {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export function Heading({ children, level = 1, className, as }: HeadingProps) {
  const Component = as || (`h${level}` as keyof React.JSX.IntrinsicElements);
  return (
    <Component className={cn(headingVariants({ level }), className)}>
      {children}
    </Component>
  );
}
