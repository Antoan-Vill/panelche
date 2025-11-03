import { notFound } from 'next/navigation';
import { getProductById, getProductVariants } from '@/lib/services/cloudcart';
import type { Variant } from '@/lib/types/products';
import AddToCart from '@/components/storefront/AddToCart';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;

  const productJson = await getProductById(id).catch(() => null);
  if (!productJson || !productJson.data) notFound();

  const product = productJson.data;
  const variants: Variant[] = await getProductVariants(id).catch(() => []);

  const priceCents: number | null = product?.attributes?.price ?? null;
  const imageUrl: string | null = product?.attributes?.thumbnail_url || product?.attributes?.image_url || null;
  const baseSku: string | null = product?.attributes?.sku || null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="w-full bg-muted rounded overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {imageUrl ? <img src={imageUrl} alt={product.attributes?.name ?? 'Product'} className="w-full h-auto" /> : <div className="p-8 text-muted-foreground">No image</div>}
      </div>

      <div>
        <h1 className="text-2xl font-semibold mb-2">{product.attributes?.name}</h1>
        {priceCents ? (
          <div className="text-lg font-bold mb-4">{(priceCents / 100).toFixed(2)}</div>
        ) : null}

        <div className="mb-6">
          <AddToCart
            productId={id}
            productName={product.attributes?.name}
            baseSku={baseSku}
            imageUrl={imageUrl}
            priceCents={priceCents}
            variants={variants}
          />
        </div>

        {product.attributes?.description ? (
          <div className="prose max-w-none text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: product.attributes.description }} />
        ) : null}
      </div>
    </div>
  );
}


