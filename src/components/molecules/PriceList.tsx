'use client';

import type { ProductPrice } from '@/lib/types/products';

// Price type labels (Bulgarian translations)
const PRICE_TYPE_LABELS: Record<string, string> = {
  'retail': 'Крайна цена',
  'wholesale': 'Едро',
  'wholesale_off_season': 'Едро извън сезон',
  'online_discounted': 'Онлайн намалена',
  'promo_25': 'Промо -25%',
  'promo_50': 'Промо -50%',
};

interface PriceListProps {
  prices?: ProductPrice[];
  /** If true, values are in cents and need to be divided by 100 */
  inCents?: boolean;
  /** CSS class for the container */
  className?: string;
  /** Show compact view (single line) */
  compact?: boolean;
}

/**
 * Format price type for display
 */
function formatPriceType(type: string): string {
  return PRICE_TYPE_LABELS[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Component to display all product prices
 */
export function PriceList({ 
  prices, 
  inCents = false, 
  className = '',
  compact = false 
}: PriceListProps) {
  if (!prices || prices.length === 0) {
    return null;
  }

  const formatValue = (value: number) => {
    const displayValue = inCents ? value / 100 : value;
    return displayValue.toFixed(2);
  };

  if (compact) {
    return (
      <div className={`flex flex-wrap gap-2 text-xs ${className}`}>
        {prices.map((p, i) => (
          <span key={i} className="bg-gray-100 dark:bg-neutral-700 px-2 py-0.5 rounded">
            <span className="text-muted-foreground">{formatPriceType(p.type)}:</span>{' '}
            <span className="font-medium">{formatValue(p.value)} лв</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {prices.map((p, i) => (
        <div key={i} className="flex justify-between text-sm">
          <span className="text-muted-foreground">{formatPriceType(p.type)}</span>
          <span className="font-medium">{formatValue(p.value)} лв</span>
        </div>
      ))}
    </div>
  );
}

export default PriceList;
