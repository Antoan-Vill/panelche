// src/components/admin/CopyEditUrlButton.tsx
'use client';

export default function CopyEditUrlButton({ productId }: { productId: number | string }) {
  const url = `https://ellenmore.com/admin/products/edit/${productId}`;
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(url)}
      className="absolute bottom-0 left-0 w-24 h-20 bg-white/10 hover:bg-white/70 transition-all duration-300"
      aria-label="Copy admin edit URL"
    />
  );
}