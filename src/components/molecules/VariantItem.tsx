'use client';

import { useState } from 'react';
import { Variant } from '@/lib/types/products';
import VariantStockManager from '@/components/organisms/VariantStockManager';

import { priceIndex, lookupSku, type PriceRow } from '@/lib/sku-index';


interface VariantItemProps {
  variant: Variant;
}

export default function VariantItem({ variant }: VariantItemProps) {
  const [copied, setCopied] = useState(false);
  const [showStockManager, setShowStockManager] = useState(variant.attributes.quantity > 0);
  const [currentQuantity, setCurrentQuantity] = useState(variant.attributes.quantity);
  const isOutOfStock = currentQuantity === 0;

  const handleCopyId = async () => {
    if (isOutOfStock && !showStockManager) {
      // Don't copy ID when clicking on the out of stock badge
      return;
    }
    try {
      await navigator.clipboard.writeText(variant.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy ID:', err);
    }
  };

  const handleBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the parent click handler
    setShowStockManager(true);
  };

  const handleStockChange = (variantId: string, newQuantity: number) => {
    setCurrentQuantity(newQuantity);
  };

  const handleStockManagerClose = () => {
    // If quantity is still 0, hide the stock manager again
    if (currentQuantity === 0) {
      setShowStockManager(false);
    }
  };

  return (
    <div
      key={variant.id}
      title={variant.id}
      onClick={handleCopyId}
      className="relative text-xs text-muted-foreground bg-muted p-2 rounded cursor-pointer hover:bg-muted transition-colors"
    >
      <div className="flex justify-between items-center">
        <span className="font-medium">
          {variant.attributes.v1 && `Size: ${variant.attributes.v1}`}
        </span>
        <div>
          <span className="me-1 text-green-600 font-medium">
            {(variant.attributes.price / 100).toFixed(2)} лв
          </span>
          <span className="text-muted-foreground">{lookupSku(variant.attributes.sku, priceIndex)?.['angro-offseason']}</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">{lookupSku(variant.attributes.sku, priceIndex)?.['angro-inseason']}</span>
          {/* <span className="text-muted-foreground"> / </span> */}
          {/* <span className="text-muted-foreground">{lookupSku(variant.attributes.sku, priceIndex)?.['end-price-inseason']}</span> */}
        </div>
      </div>
      <div className="flex justify-between items-center mt-1">
        {isOutOfStock && !showStockManager ? (
          <span
            onClick={handleBadgeClick}
            className="absolute bottom-0 right-0 inline-block bg-red-500 text-white text-xs px-2 py-1 rounded font-medium cursor-pointer hover:bg-red-600 transition-colors"
          >
            Out of Stock
          </span>
        ) : (
          <VariantStockManager
            // ensure the child sees the current quantity so it shows the right label
            variant={{ ...variant, attributes: { ...variant.attributes, quantity: currentQuantity } }}
            onStockChange={handleStockChange}
            onClose={handleStockManagerClose}
          />
        )}
        <span className="text-muted-foreground">{variant.attributes.sku}</span>
      </div>
      {copied && (
        <div className="mt-1 text-green-600 text-xs font-medium">
          ID copied!
        </div>
      )}
    </div>
  );
}
