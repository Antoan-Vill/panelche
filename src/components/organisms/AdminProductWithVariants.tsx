'use client';

import { useState, useEffect } from 'react';
import { getProductVariantsClient } from '@/lib/products';
import { VariantSelector } from '@/components/molecules/VariantSelector';
import { VariantMultiSelectModal, type VariantMultiSelectModalItem } from '@/components/organisms/VariantMultiSelectModal';
import type { Product, Variant } from '@/lib/types/products';
import type { AdminCartItem } from '@/lib/types/customers';

import { faExternalLink, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface AdminProductWithVariantsProps {
  index: number;
  product: Product;
  onAddToCart: (item: Omit<AdminCartItem, 'lineTotal'>) => void;
}

export function AdminProductWithVariants({
  index,
  product,
  onAddToCart
}: AdminProductWithVariantsProps) {
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

  // Open modal automatically when variants are loaded and product is expanded
  useEffect(() => {
    if (expanded && variants.length > 0 && !loadingVariants) {
      setShowVariantModal(true);
    }
  }, [expanded, variants, loadingVariants]);

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
            <span>
              <a href={`${process.env.NEXT_PUBLIC_SITE_URL}/product/${product.attributes.url_handle}`} target="_blank" rel="noopener noreferrer">
                {product.attributes.name}
              </a>
              <a href={`${process.env.NEXT_PUBLIC_SITE_URL}/admin/products/edit/${product.id}`} target="_blank" rel="noopener noreferrer">
                <sup>
                  <FontAwesomeIcon icon={faExternalLink} className="ml-1" />
                </sup>
              </a>
            </span>
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
            <div className="text-sm text-muted-foreground py-2" title="Зареждане на варианти...">Loading variants...</div>
          ) : (
            <VariantSelector
              variants={variants}
              priceCents={product.attributes.price ?? null}
              baseSku={product.attributes.sku ?? null}
              enablePivotToMulti
              onRequestMultiSelect={({ initialSelectedIds }) => {
                // setInitialSelectedVariantIds(initialSelectedIds);
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
                  note: '',
                });
                setExpanded(false);
              }}
            />
          )}
        </div>
      )}

      {showVariantModal && (
        <VariantMultiSelectModal
          product={product}
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
            setExpanded(false); // Close the product card when the modal is closed
          }}
          onConfirm={(items: VariantMultiSelectModalItem[]) => {
            items.forEach(({ variantId, quantity, unitPrice, sku, note }) => {
              onAddToCart({
                productId: product.id,
                productName: product.attributes.name,
                variantId,
                imageUrl: product.attributes.image_url || null,
                sku: sku ?? null,
                unitPrice,
                quantity,
                note,
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

