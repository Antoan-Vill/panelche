'use client';

import { useState, useRef, useEffect } from 'react';
import { Variant } from '@/lib/types/products';
import { useUpdateVariantStock } from '@/hooks';

interface VariantStockManagerProps {
  variant: Variant;
  onStockChange?: (variantId: string, newQuantity: number) => void;
  onClose?: () => void;
}

export default function VariantStockManager({ variant, onStockChange, onClose }: VariantStockManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [displayQuantity, setDisplayQuantity] = useState(variant.attributes.quantity);
  const [inputQuantity, setInputQuantity] = useState(variant.attributes.quantity);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { update } = useUpdateVariantStock(variant.id);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setDisplayQuantity(variant.attributes.quantity);
    if (!isEditing) {
      setInputQuantity(variant.attributes.quantity);
    }
  }, [variant.attributes.quantity, isEditing]);

  const handleClick = () => {
    if (!isLoading) {
      setIsEditing(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0) {
      setInputQuantity(value);
    }
  };

  const handleInputBlur = async () => {
    const newQuantity = inputQuantity;
    const originalQuantity = displayQuantity;

    setIsEditing(false);

    if (newQuantity !== originalQuantity) {
      setIsLoading(true);
      try {
        const result = await update(newQuantity);
        const serverQtyRaw = (result as any)?.data?.attributes?.quantity ?? (result as any)?.attributes?.quantity ?? newQuantity;
        const numericServerQty = Number(serverQtyRaw);
        const updatedQuantity = Number.isFinite(numericServerQty) ? numericServerQty : newQuantity;
        if (!Number.isFinite(numericServerQty)) {
          console.warn('Variant stock response missing quantity; using input value', { result });
        }
        setDisplayQuantity(updatedQuantity);
        setInputQuantity(updatedQuantity);
        if (onStockChange) {
          onStockChange(variant.id, updatedQuantity);
        }
      } catch (error) {
        console.error('Failed to update stock:', error);
        setInputQuantity(originalQuantity);
      } finally {
        setIsLoading(false);
      }
    }

    // Always call onClose after blur
    if (onClose) {
      onClose();
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    } else if (e.key === 'Escape') {
      setInputQuantity(displayQuantity);
      setIsEditing(false);
    }
  };

  return (
    <span
      className={`cursor-pointer hover:bg-muted px-1 py-0.5 rounded transition-colors ${
        isEditing ? 'bg-blue-100' : ''
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={handleClick}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="number"
          min="0"
          value={inputQuantity}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          disabled={isLoading}
          className="w-16 text-center bg-card border border-border rounded px-1 py-0.5 text-xs"
        />
      ) : (
        <span>Stock: {isLoading ? '...' : displayQuantity}</span>
      )}
    </span>
  );
}
