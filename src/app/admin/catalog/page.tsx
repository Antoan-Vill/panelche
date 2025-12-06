import Link from 'next/link';
import { cookies } from 'next/headers';
import type { Product } from '@/lib/types/products';
import { cloudCartCategories, cloudCartProducts } from '@/lib/services/cloudcart';
import { firestoreCategories, firestoreProducts } from '@/lib/services/firestore';
import { CategoryList, DashboardHeader, Pagination, ProductVariants, VariantsToggleButton } from '@/components';
import { PriceList } from '@/components/molecules';
import LoadAllImagesButton from '@/components/admin/LoadAllImagesButton';
import HoverImage from '@/components/admin/HoverImage';
import { VariantVisibilityProvider } from '@/lib/variant-visibility';
import { VariantsPreloadProvider } from '@/lib/variants-preload';
import VariantsBatchPreloader from '@/components/VariantsBatchPreloader';
import CopyEditUrlButton from '@/components/admin/CopyEditUrlButton';
import ProductImageDropZone from '@/components/admin/ProductImageDropZone';
import { CatalogEmptyState } from '@/components/admin/CatalogEmptyState';
import { PriceNotAvailable, StockLabel } from '@/components/admin/ProductCardLabels';

interface AdminProductsPageProps {
  searchParams: Promise<{ slug?: string; page?: string; showHidden?: string; source?: string }>;
}

import { productIdsLastChance } from '@/../constants';

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const { slug, page, showHidden, source: sourceParam } = await searchParams;
  const currentPage = page ? parseInt(page, 10) : 1;
  const showHiddenProducts = showHidden === '1';
  
  // Get data source from cookie (set by client-side context) or URL param
  const cookieStore = await cookies();
  const sourceCookie = cookieStore.get('data-source')?.value;
  const dataSource = sourceParam || sourceCookie || 'firestore';
  const isFirestore = dataSource === 'firestore';

  // Fetch all categories for sidebar (server-side, use services directly)
  const categoriesService = isFirestore ? firestoreCategories : cloudCartCategories;
  const categories = await categoriesService.getAll();

  // If no slug selected, show empty state
  if (!slug) {
    return (
      <div className="min-h-screen bg-background">

        <div className="flex">
          <CategoryList categories={categories} />

          <div className="flex-1 p-8">
            <div className="bg-card rounded-lg shadow">
              <CatalogEmptyState type="no-category" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fetch category info
  const category = await categoriesService.getBySlug(slug).catch(() => null);
  if (!category) {
    return (
      <div className="min-h-screen bg-background">

        <div className="flex">
          <CategoryList categories={categories} activeSlug={slug} />

          <div className="flex-1 p-8">
            <div className="bg-card rounded-lg shadow">
              <CatalogEmptyState type="category-not-found" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fetch products (fallback to empty on failure)
  const productsService = isFirestore ? firestoreProducts : cloudCartProducts;
  const productsResponse = await productsService.getByCategory(slug, currentPage).catch(() => ({
    data: [],
    meta: { page: { 'current-page': currentPage, 'per-page': 100, from: 0, to: 0, total: 0, 'last-page': 1 } }
  }));

  // Filter out hidden product IDs; image will be fetched on hover if missing
  const allProducts = productsResponse.data;
  const products = showHiddenProducts
    ? allProducts
    : allProducts; //.filter((product: Product) => !productIdsLastChance.includes(Number(product.id)));

  const baseParams: Record<string, string> = {};
  if (slug) {
    baseParams.slug = slug;
  }
  if (page && page !== '1') {
    baseParams.page = page;
  }
  if (showHiddenProducts) {
    baseParams.showHidden = '1';
  }

  const buildProductsUrl = (overrides: Record<string, string | null>) => {
    const params = new URLSearchParams(baseParams);

    for (const [key, value] of Object.entries(overrides)) {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    const queryString = params.toString();
    return queryString ? `/admin/catalog?${queryString}` : '/admin/catalog';
  };

  const toggleHiddenProductsHref = showHiddenProducts
    ? buildProductsUrl({ showHidden: null, page: null })
    : buildProductsUrl({ showHidden: '1', page: null });

  const paginationBaseUrl = buildProductsUrl({ page: null });

  return (
    <div className="min-h-screen bg-background">

      <div className="flex">
        <CategoryList categories={categories} activeSlug={slug} />

          <div className="flex-1">
          {/* Category Header */}
            <div className="bg-card mb-6">
              <div className="px-6 py-4 border-b border-border">
              <div className="relative">
                <div className="pr-20">
                  <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-lg font-bold text-foreground">{category.attributes.name} / {category.id}</h1>
                      {/* {category.attributes.description && (
                        <p className="text-muted-foreground mt-1" dangerouslySetInnerHTML={{ __html: category.attributes.description }}></p>
                    )} */}
                  </div>
                </div>
                <span className="absolute top-0 right-0 bg-primary/10 text-primary text-sm px-3 py-1 rounded-full" title="общо / видими">
                {productsResponse.meta.page.total} total / {products.length} visible
                </span>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <VariantVisibilityProvider>
            <VariantsPreloadProvider>
              <div className="bg-card">
                <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                  {/* <h2 className="text-lg font-medium text-foreground">Products</h2> */}
                  <div className="flex items-center gap-2">
                    <VariantsToggleButton />
                    <LoadAllImagesButton products={products} />
                    {/* <Link
                      href={toggleHiddenProductsHref}
                      className="text-sm font-medium text-primary hover:text-primary/80 px-3 py-1 rounded border border-primary/20 hover:border-primary/30 transition-colors"
                      title={showHiddenProducts ? 'Скрий изключени продукти' : 'Покажи изключени продукти'}
                    >
                      {showHiddenProducts ? 'Hide excluded products' : 'Show excluded products'}
                    </Link> */}
                  </div>
                </div>
              </div>
              <VariantsBatchPreloader productIds={products.map((p) => p.id)} />
              <div className="border border-red-100 border-0 rounded-md">
                {products.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0">
                    {products.map((product, index) => (
                      <div key={product.id} className="relative border border-border border-l-0 border-t-0 overflow-hidden">
                        <ProductImageDropZone product={product}>
                          <div className="relative">
                            <HoverImage
                              product={product}
                              className=""
                              imgClassName="w-full h-48 object-cover"
                            />
                            <Link href={`https://ellenmore.com/product/${product.attributes.url_handle}`} className="absolute bottom-0 right-0 w-24 h-20 bg-white/10 hover:bg-white/70 transition-all duration-300" target="_blank">
                              <span className="text-white text-sm">
                                
                              </span>
                            </Link>
                            <CopyEditUrlButton productId={Number(product.id)} />
                          </div>
                        </ProductImageDropZone>
                        <div className="p-4" title={product.id.toString()}>
                          <h3 className="font-medium text-foreground mb-2">{product.attributes.name}{product.attributes?.color ? ` - ${product.attributes?.color}` : ''}</h3>
                          {/* Show all prices if available */}
                          {product.attributes.prices && product.attributes.prices.length > 0 ? (
                            <div className="mb-2">
                              <PriceList 
                                prices={product.attributes.prices} 
                                inCents={!isFirestore}
                                compact 
                              />
                            </div>
                          ) : product.attributes.price ? (
                            <p className="text-lg font-bold text-green-600 mb-2">
                              {isFirestore 
                                ? product.attributes.price.toFixed(2) 
                                : (product.attributes.price / 100).toFixed(2)
                              } лв
                            </p>
                          ) : product.attributes.price_from && product.attributes.price_to ? (
                            product.attributes.price_from === product.attributes.price_to ? (
                              <p className="text-lg font-bold text-green-600 mb-2">
                                {(product.attributes.price_from / 100).toFixed(2)} лв
                              </p>
                            ) : (
                              <p className="text-lg font-bold text-green-600 mb-2">
                                {(product.attributes.price_from / 100).toFixed(2)} - {(product.attributes.price_to / 100).toFixed(2)} лв
                              </p>
                            )
                          ) : (
                              <PriceNotAvailable />
                          )}
                          {product.attributes.stock_quantity !== undefined && (
                            <StockLabel quantity={product.attributes.stock_quantity} />
                          )}
                          <ProductVariants productId={product.id} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <CatalogEmptyState type="no-products" />
                )}
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={productsResponse.meta.page['current-page']}
                totalPages={productsResponse.meta.page['last-page']}
                categorySlug={slug}
                totalItems={productsResponse.meta.page.total}
                itemsPerPage={productsResponse.meta.page['per-page']}
                baseUrl={paginationBaseUrl}
              />
            </div>
            </VariantsPreloadProvider>
          </VariantVisibilityProvider>
        </div>
      </div>
    </div>
  );
}
