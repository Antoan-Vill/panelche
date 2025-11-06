import Link from 'next/link';
import type { Product } from '@/lib/types/products';
import { getProductsByCategory, getCategoryBySlug } from '@/lib/services/cloudcart';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function StoreCategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page } = await searchParams;
  const currentPage = page ? parseInt(page, 10) : 1;

  const category = await getCategoryBySlug(slug).catch(() => null);
  if (!category) notFound();

  const productsResp = await getProductsByCategory(slug, currentPage).catch(() => ({ data: [], meta: { page: { 'current-page': 1, 'per-page': 100, from: 0, to: 0, total: 0, 'last-page': 1 } } }));
  const products = productsResp.data as Product[];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">{category.attributes.name}</h1>
      {/* {category.attributes.description && (
        <div className="text-sm text-muted-foreground mb-4">{category.attributes.description}</div>
      )} */}

      {products.length === 0 ? (
        <div className="text-muted-foreground">No products in this category.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.id} className="border border-border rounded hover:shadow overflow-hidden">
              <div className="w-full h-48 bg-muted flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.attributes.thumbnail_url || p.attributes.image_url ? (
                  <img
                    src={p.attributes.thumbnail_url || p.attributes.image_url || ''}
                    alt={p.attributes.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-muted-foreground text-xs">No image</span>
                )}
              </div>
              <div className="p-4">
                <div className="font-medium mb-1 line-clamp-1">{p.attributes.name}</div>
                {p.attributes.price ? (
                  <div className="text-sm font-semibold mb-2">{(p.attributes.price / 100).toFixed(2)}</div>
                ) : null}
                <Link href={`/store/product/${p.id}`} className="text-sm text-blue-600 hover:text-blue-800">
                  View details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


