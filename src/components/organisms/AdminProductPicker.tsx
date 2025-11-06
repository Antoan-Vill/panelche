'use client';

import { useState, useEffect } from 'react';
import { getCategories } from '@/lib/categories';
import { getProductsByCategory, getProductVariantsClient } from '@/lib/products';
import { VariantSelector } from '@/components/molecules/VariantSelector';
import { variantLabel } from '@/lib/variants';
import type { Category } from '@/lib/categories';
import type { Product, Variant, ProductsResponse } from '@/lib/types/products';
import type { AdminCartItem } from '@/lib/types/customers';

// Component for displaying a product with its variants inline
function ProductWithVariants({
  product,
  onAddToCart
}: {
  product: Product;
  onAddToCart: (item: Omit<AdminCartItem, 'lineTotal'>) => void;
}) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;

    const loadVariants = async () => {
      setLoadingVariants(true);
      try {
        const vars = await getProductVariantsClient(product.id);
        setVariants(vars);
      } catch (error) {
        console.error('Error loading variants:', error);
        setVariants([]);
      } finally {
        setLoadingVariants(false);
      }
    };

    loadVariants();
  }, [expanded, product]);

  // Variant selection handled by VariantSelector below

  return (
    <div className="border-b last:border-b-0">
      {/* Product Header */}
      <div className="flex items-center justify-between p-3 hover:bg-muted">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {product.attributes.image_id && (
            <img
              src={product.attributes.image_id}
              alt=""
              className="w-10 h-10 object-cover rounded flex-shrink-0"
            />
          )}
          <div className="min-w-0">
            <div className="font-medium text-sm truncate">{product.attributes.name}</div>
            <div className="text-xs text-muted-foreground">${(product.attributes.price || 0).toFixed(2)}</div>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          {expanded ? 'Cancel' : 'Add'}
        </button>
      </div>

      {/* Expanded Variant Selection */}
      {expanded && (
        <div className="px-3 pb-3 bg-muted">
          {loadingVariants ? (
            <div className="text-sm text-muted-foreground py-2">Loading variants...</div>
          ) : (
            <VariantSelector
              variants={variants}
              priceCents={product.attributes.price ?? null}
              baseSku={product.attributes.sku ?? null}
              onAdd={({ selectedVariantId, quantity, unitPrice, sku }) => {
                const chosen = variants.find((v) => v.id === selectedVariantId) || null;
                onAddToCart({
                  productId: product.id,
                  productName: product.attributes.name,
                  variantId: selectedVariantId ?? null,
                  imageUrl: product.attributes.image_url || null,
                  sku: sku ?? null,
                  unitPrice,
                  quantity,
                });
                setExpanded(false);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

interface AdminProductPickerProps {
  onAddToCart: (item: Omit<AdminCartItem, 'lineTotal'>) => void;
}

export function AdminProductPicker({ onAddToCart }: AdminProductPickerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await getCategories();
        setCategories(cats);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Load products when category changes
  useEffect(() => {
    if (!selectedCategory) {
      setProducts([]);
      return;
    }

    const controller = new AbortController();
    const loadProducts = async () => {
      setLoading(true);
      try {
        const response: ProductsResponse = await getProductsByCategory(selectedCategory.attributes.url_handle!, 1);
        setProducts(response.data);
      } catch (error) {
        if ((error as any)?.name !== 'AbortError') {
          console.error('Error loading products:', error);
          setProducts([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
    return () => controller.abort();
  }, [selectedCategory]);

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="text-lg font-medium mb-4">Add Products</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories */}
        <div>
          <h4 className="font-medium mb-2">Categories</h4>
          <div className="border border-border rounded max-h-60 overflow-y-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category)}
                className={`w-full text-left px-3 py-2 hover:bg-muted border-b last:border-b-0 ${
                  selectedCategory?.id === category.id ? 'bg-blue-50 text-blue-700' : ''
                }`}
              >
                {category.attributes.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products with inline variant selection */}
        <div>
          <h4 className="font-medium mb-2">Products</h4>
          <div className="border border-border rounded max-h-96 overflow-y-auto">
            {loading && <div className="p-4 text-center text-muted-foreground">Loading...</div>}
            {!loading && products.length === 0 && selectedCategory && (
              <div className="p-4 text-center text-muted-foreground">No products found</div>
            )}
            {!loading && !selectedCategory && (
              <div className="p-4 text-center text-muted-foreground">Select a category to browse products</div>
            )}
            {products.map((product) => (
              <ProductWithVariants
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
