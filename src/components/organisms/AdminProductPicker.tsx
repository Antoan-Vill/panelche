'use client';

import { useState, useEffect } from 'react';
import { getCategories } from '@/lib/categories';
import { getProductsByCategory, getProductVariantsClient } from '@/lib/products';
import { VariantSelector } from '@/components/molecules/VariantSelector';
import { VariantMultiSelectModal, type VariantMultiSelectModalItem } from '@/components/organisms/VariantMultiSelectModal';
import { variantLabel } from '@/lib/variants';
import { useProductSearch } from '@/hooks/useProductSearch';
import type { Category } from '@/lib/categories';
import type { Product, Variant, ProductsResponse } from '@/lib/types/products';
import type { AdminCartItem } from '@/lib/types/customers';

import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


// Helper function to get products and cache thems
const PRODUCTS_CACHE_KEY = 'av:productsCache:v1';
const PRODUCTS_CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12h

type CachedCategory = { updatedAt: number; products: Product[] };
type ProductsCache = Record<string, CachedCategory>;

function loadProductsCache(): ProductsCache {
  try {
    const raw = localStorage.getItem(PRODUCTS_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProductsCache(cache: ProductsCache) {
  try {
    localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function getCachedCategoryProducts(slug: string, maxAgeMs = PRODUCTS_CACHE_TTL_MS): Product[] | null {
  const cache = loadProductsCache();
  const entry = cache[slug];
  if (!entry) return null;
  if (Date.now() - entry.updatedAt > maxAgeMs) return null;
  return entry.products || null;
}

function setCachedCategoryProducts(slug: string, products: Product[]) {
  const cache = loadProductsCache();
  cache[slug] = { updatedAt: Date.now(), products };
  saveProductsCache(cache);
}

function getAllCachedProducts(maxAgeMs = PRODUCTS_CACHE_TTL_MS): Product[] {
  const cache = loadProductsCache();
  return Object.values(cache).flatMap(entry => entry.products).filter(Boolean);
}
// END of products cache helpers

// Component for displaying a product with its variants inline
function ProductWithVariants({
  index,
  product,
  onAddToCart
}: {
  index: number;
  product: Product;
  onAddToCart: (item: Omit<AdminCartItem, 'lineTotal'>) => void;
}) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [initialSelectedVariantIds, setInitialSelectedVariantIds] = useState<string[]>([]);

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
    <div className="border-b border-border last:border-b-0">
      {/* Product Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center justify-between p-3 cursor-pointer${expanded ? ' bg-muted' : ''}`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* {product.attributes.image_id && (
            <img
              src={product.attributes.image_id}
              alt=""
              className="w-10 h-10 object-cover rounded flex-shrink-0"
            />
          )} */}
          <div className="flex items-center justify-between w-full font-medium text-sm truncate">
            {product.attributes.name}
            <sup className="opacity-10 text-xs text-muted-foreground">{index + 1}.</sup>
          </div>
          {/* <div className="text-xs text-muted-foreground">${(product.attributes.price || 0).toFixed(2)}</div> */}
        </div>
        {expanded ? (
          <span className="px-3 py-2 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 -mt-3 -mr-3" >
            <FontAwesomeIcon icon={faXmark} />
          </span>
        ) : (
          ''
        )}
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
              enablePivotToMulti
              onRequestMultiSelect={({ initialSelectedIds }) => {
                setInitialSelectedVariantIds(initialSelectedIds);
                setShowVariantModal(true);
              }}
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

      {showVariantModal && (
        <VariantMultiSelectModal
          productId={product.id}
          productName={product.attributes.name}
          imageUrl={product.attributes.image_url || null}
          baseSku={product.attributes.sku || null}
          priceCents={product.attributes.price ?? null}
          variants={variants}
          initialSelectedIds={initialSelectedVariantIds}
          onCancel={() => {
            setShowVariantModal(false);
            setInitialSelectedVariantIds([]);
          }}
          onConfirm={(items: VariantMultiSelectModalItem[]) => {
            console.log('items', items);
            items.forEach(({ variantId, quantity, unitPrice, sku }) => {
              onAddToCart({
                productId: product.id,
                productName: product.attributes.name,
                variantId,
                imageUrl: product.attributes.image_url || null,
                sku: sku ?? null,
                unitPrice,
                quantity,
              });
            });
            // setShowVariantModal(false);
            // setInitialSelectedVariantIds([]);
            // setExpanded(false);
          }}
        />
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
        if (cats.length) {
          // select the first category to trigger product load
          setSelectedCategory((prev) => prev ?? cats[0]);
        }
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
  
    const slug = selectedCategory.attributes?.url_handle;
    if (!slug) {
      setProducts([]);
      return;
    }
  
    const cached = getCachedCategoryProducts(slug);
    if (cached) {
      setProducts(cached);
      return; // cache hit; skip network
    }
  
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const first: ProductsResponse = await getProductsByCategory(slug, 1);
        const lastPage = first?.meta?.page?.['last-page'] ?? 1;
        let all = [...(first?.data ?? [])];
        for (let page = 2; page <= lastPage; page++) {
          const resp = await getProductsByCategory(slug, page);
          all = all.concat(resp?.data ?? []);
        }
        if (!ignore) {
          setProducts(all);
          setCachedCategoryProducts(slug, all);
        }
      } catch (error: any) {
        if (!ignore) {
          console.error('Error loading products:', error);
          setProducts([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
  
    return () => { ignore = true; };
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedCategory) return;
  
    const cachedAll = getAllCachedProducts();
    if (cachedAll.length) {
      setProducts(cachedAll);
      return;
    }
  
    const controller = new AbortController();
    let ignore = false;
  
    (async () => {
      setLoading(true);
      try {
        const base = process.env.NEXT_PUBLIC_APP_URL || '';
        const res = await fetch(`${base}/api/products?page=1&per_page=100`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        const json = await res.json();
        if (!ignore) setProducts(Array.isArray(json.data) ? json.data : []);
      } catch (e: any) {
        if (!ignore && e?.name !== 'AbortError') setProducts([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
  
    return () => { ignore = true; controller.abort(); };
  }, [selectedCategory]);

  useEffect(() => {
    if (!categories.length) return;
  
    const run = async () => {
      for (const c of categories) {
        const slug = c.attributes?.url_handle;
        if (!slug) continue;
        if (getCachedCategoryProducts(slug)) continue; // fresh
  
        try {
          const first: ProductsResponse = await getProductsByCategory(slug, 1);
          const lastPage = first?.meta?.page?.['last-page'] ?? 1;
          let all = [...(first?.data ?? [])];
          for (let page = 2; page <= lastPage; page++) {
            const resp = await getProductsByCategory(slug, page);
            all = all.concat(resp?.data ?? []);
            await sleep(50); // be polite
          }
          setCachedCategoryProducts(slug, all);
        } catch {
          // ignore category fetch errors in background
        }
      }
    };
  
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(run, { timeout: 2000 });
    } else {
      setTimeout(run, 0);
    }
  }, [categories]);

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
  };

  const { search, handleSearch, handleClearSearch, filteredProducts } = useProductSearch(products);

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="uppercase text-xs opacity-50 mb-2 font-bold">Add Products</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories */}
        <div className="border border-border rounded">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`w-full text-left px-3 py-2 hover:bg-muted border-b ${
              !selectedCategory ? 'bg-blue-50 text-blue-700' : ''
            }`}
          >
            All products
            {/* <FontAwesomeIcon icon={faXmark} /> */}
          </button>
          <div className="border border-border rounded max-h-96 overflow-y-auto">
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
          <div className="flex items-center justify-between">
            <h4 className="uppercase text-xs opacity-50 mb-2 mr-2 font-bold">Products</h4>
            <div className="searchProducts w-full">
              <input type="text" placeholder="Search" className="w-full mb-2 border border-border rounded px-2 py-1 text-sm" onChange={(e: any) => handleSearch(e.target.value)} />
              {search && (
                <button onClick={() => handleClearSearch()} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Clear</button>
              )}
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto border border-border rounded">
            {loading && <div className="p-4 text-center text-muted-foreground">Loading...</div>}
            {!loading && filteredProducts.length === 0 && selectedCategory && (
              <div className="p-4 text-center text-muted-foreground">No products found</div>
            )}
            {!loading && !selectedCategory && filteredProducts.length === 0 && (
              <div className="p-4 text-center text-muted-foreground">
                Browse all products or pick a category
              </div>
            )}
            {filteredProducts.map((product: Product, index: number) => (
              <ProductWithVariants
                key={product.id}
                index={index}
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
