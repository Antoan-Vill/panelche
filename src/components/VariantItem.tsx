'use client';

import { useState } from 'react';
import { Variant } from '@/lib/types/products';
import VariantStockManager from './VariantStockManager';

interface VariantItemProps {
  variant: Variant;
  updateStockAction?: (variantId: string, quantity: number) => Promise<number | null>;
}

export default function VariantItem({ variant, updateStockAction }: VariantItemProps) {
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
      className="text-xs text-muted-foreground bg-muted p-2 rounded cursor-pointer hover:bg-muted transition-colors"
    >
      <div className="flex justify-between items-center">
        <span className="font-medium">
          {variant.attributes.v1 && `Size: ${variant.attributes.v1}`}
        </span>
        <span className="text-green-600 font-medium">
          {(variant.attributes.price / 100).toFixed(2)} лв
        </span>
      </div>
      <div className="flex justify-between items-center mt-1">
        {showStockManager ? (
          <VariantStockManager
            variant={variant}
            onStockChange={handleStockChange}
            onClose={handleStockManagerClose}
            updateStockAction={updateStockAction}
          />
        ) : (
          isOutOfStock && (
            <span
              onClick={handleBadgeClick}
              className="inline-block bg-red-500 text-white text-xs px-2 py-1 rounded font-medium cursor-pointer hover:bg-red-600 transition-colors"
            >
              Out of Stock
            </span>
          )
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
