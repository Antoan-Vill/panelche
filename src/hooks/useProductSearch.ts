import { useState, useMemo, useCallback } from 'react';
import type { Product } from '@/lib/types/products';

export function useProductSearch(products: Product[]) {
  const [search, setSearch] = useState('');

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term.length <= 2) return products;
    return products.filter((product) =>
      product.attributes.name.toLowerCase().includes(term)
    );
  }, [products, search]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearch('');
  }, []);

  return {
    search,
    setSearch,
    filteredProducts,
    handleSearch,
    handleClearSearch,
  };
}


