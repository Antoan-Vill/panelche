'use client';

import { useVariantVisibility } from '@/lib/variant-visibility';

export default function VariantsToggleButton() {
  const { showVariants, toggleVariants, anyVariantsVisible, hideAllVariants } = useVariantVisibility();

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={toggleVariants}
        className="text-sm font-medium text-blue-600 hover:text-blue-800 px-3 py-1 rounded border border-blue-200 hover:border-blue-300 transition-colors"
      >
        {showVariants ? 'Hide All Variants' : 'Show All Variants'}
      </button>

      {anyVariantsVisible && (
        <button
          type="button"
          onClick={hideAllVariants}
          className="text-sm font-medium text-red-600 hover:text-red-800 px-3 py-1 rounded border border-red-200 hover:border-red-300 transition-colors"
        >
          Hide All Variants
        </button>
      )}
    </div>
  );
}
