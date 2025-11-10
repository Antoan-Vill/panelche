import Link from 'next/link';
import type { Product } from '@/lib/types/products';
import { getProductsByCategory, getCategoryBySlug } from '@/lib/services/cloudcart';
import { getCategories } from '@/lib/categories';
import { CategoryList, DashboardHeader, Pagination, ProductVariants, VariantsToggleButton } from '@/components';
import LoadAllImagesButton from '@/components/admin/LoadAllImagesButton';
import HoverImage from '@/components/admin/HoverImage';
import { VariantVisibilityProvider } from '@/lib/variant-visibility';
import { VariantsPreloadProvider } from '@/lib/variants-preload';
import VariantsBatchPreloader from '@/components/VariantsBatchPreloader';
import CopyEditUrlButton from '@/components/admin/CopyEditUrlButton';

interface AdminProductsPageProps {
  searchParams: Promise<{ slug?: string; page?: string; showHidden?: string }>;
}

const productIdsToHide = [
  693,
  349,
  715,
  366,
  365,
  364,
  937,
  644,
  642,
  80,
  79,
  301,
  341,
  836,
  748,
  712,
  118,
  730,
  728,
  727,
  726,
  844,
  934,
  631,
  629,
  628,
  627,
  625,
  624,
  623,
  611,
  610,
  103,
  105,
  605,
  604,
  603,
  613,
  608,
  254,
  825,
  813,
  808,
  317,
  981,
  323,
  318,
  320,
  346,
  68,
  695,
  534,
  559,
  562,
  298,
  621,
  83,
  23,
  646,
  645,
  367,
  641,
  190,
  977,
  963,
  961,
  959,
  802,
  869,
  838,
  833,
  828,
  764,
  550,
  549,
  546,
  511,
  509,
  508,
  505,
  497,
  614,
  694,
  721,
  630,
  612,
  607,
  72,
  570,
  640,
  1062,
  1023,
  868
];

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const { slug, page, showHidden } = await searchParams;
  const currentPage = page ? parseInt(page, 10) : 1;
  const showHiddenProducts = showHidden === '1';

  // Fetch all categories for sidebar
  const categories = await getCategories();

  // If no slug selected, show empty state
  if (!slug) {
    return (
      <div className="min-h-screen bg-background">

        <div className="flex">
          <CategoryList categories={categories} />

          <div className="flex-1 p-8">
            <div className="bg-card rounded-lg shadow">
              <div className="p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-foreground" title="Няма избрана категория">No category selected</h3>
                <p className="mt-2 text-sm text-muted-foreground" title="Избери категория от страничната лента, за да видиш и управляваш продуктите й.">
                  Choose a category from the sidebar to view and manage its products.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fetch category info
  const category = await getCategoryBySlug(slug).catch(() => null);
  if (!category) {
    return (
      <div className="min-h-screen bg-background">

        <div className="flex">
          <CategoryList categories={categories} activeSlug={slug} />

          <div className="flex-1 p-8">
            <div className="bg-card rounded-lg shadow">
              <div className="p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-foreground" title="Категорията не е намерена">Category not found</h3>
                <p className="mt-2 text-sm text-muted-foreground" title="Избраната категория не може да бъде намерена. Моля, изберете друга категория.">
                  The selected category could not be found. Please select a different category.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fetch products (fallback to empty on failure)
  const productsResponse = await getProductsByCategory(slug, currentPage).catch(() => ({
    data: [],
    meta: { page: { 'current-page': currentPage, 'per-page': 100, from: 0, to: 0, total: 0, 'last-page': 1 } }
  }));

  // Filter out hidden product IDs; image will be fetched on hover if missing
  const allProducts = productsResponse.data;
  const products = showHiddenProducts
    ? allProducts
    : allProducts.filter((product: Product) => !productIdsToHide.includes(Number(product.id)));

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
                <span className="absolute top-0 right-0 bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full" title="общо / видими">
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
                    <Link
                      href={toggleHiddenProductsHref}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 px-3 py-1 rounded border border-blue-200 hover:border-blue-300 transition-colors"
                      title={showHiddenProducts ? 'Скрий изключени продукти' : 'Покажи изключени продукти'}
                    >
                      {showHiddenProducts ? 'Hide excluded products' : 'Show excluded products'}
                    </Link>
                  </div>
                </div>
              </div>
              <VariantsBatchPreloader productIds={products.map((p) => p.id)} />
              <div className="border border-red-100 border-0 rounded-md">
                {products.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0">
                    {products.map((product, index) => (
                      <div key={product.id} className="relative border border-border border-l-0 border-t-0 overflow-hidden">
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
                        <div className="p-4">
                          <h3 className="font-medium text-foreground mb-2">{product.attributes.name}</h3>
                          {product.attributes.price ? (
                            <p className="text-lg font-bold text-green-600 mb-2">
                              {(product.attributes.price / 100).toFixed(2)} лв
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
                              <p className="text-sm text-muted-foreground mb-2" title="Цената не е налична">Price not available</p>
                          )}
                          {product.attributes.stock_quantity !== undefined && (
                            <p className="text-sm text-muted-foreground" title="Наличност">
                              Stock: {product.attributes.stock_quantity}
                            </p>
                          )}
                          <ProductVariants productId={product.id} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground" title="Няма намерени продукти в тази категория.">No products found in this category.</p>
                  </div>
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
