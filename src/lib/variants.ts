import type { Variant } from '@/lib/types/products';

export function variantLabel(v: Variant): string {
  const parts = [v.attributes.v1, v.attributes.v2, v.attributes.v3].filter(Boolean) as string[];
  const sku = v.attributes.sku ? ` • ${v.attributes.sku}` : '';
  return `${parts.join(' / ') || 'Default'}`;
}


