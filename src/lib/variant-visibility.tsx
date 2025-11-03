'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

interface VariantVisibilityContextType {
  showVariants: boolean;
  toggleVariants: () => void;
  hideAllVariants: () => void;
  anyVariantsVisible: boolean;
  registerVariantVisibility: (id: string, visible: boolean) => void;
  forceCloseAll: number;
}

const VariantVisibilityContext = createContext<VariantVisibilityContextType | undefined>(undefined);

export function VariantVisibilityProvider({ children }: { children: ReactNode }) {
  const [showVariants, setShowVariants] = useState(false);
  const [visibleVariants, setVisibleVariants] = useState<Set<string>>(new Set());
  const [forceCloseAll, setForceCloseAll] = useState(0);

  const toggleVariants = useCallback(() => {
    setShowVariants(prev => !prev);
  }, []);

  const hideAllVariants = useCallback(() => {
    setShowVariants(false);
    setVisibleVariants(new Set());
    setForceCloseAll(prev => prev + 1);
  }, []);

  const registerVariantVisibility = useCallback((id: string, visible: boolean) => {
    setVisibleVariants(prev => {
      const newSet = new Set(prev);
      if (visible) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  const anyVariantsVisible = useMemo(
    () => showVariants || visibleVariants.size > 0,
    [showVariants, visibleVariants.size]
  );

  return (
    <VariantVisibilityContext.Provider value={{
      showVariants,
      toggleVariants,
      hideAllVariants,
      anyVariantsVisible,
      registerVariantVisibility,
      forceCloseAll
    }}>
      {children}
    </VariantVisibilityContext.Provider>
  );
}

export function useVariantVisibility() {
  const context = useContext(VariantVisibilityContext);
  if (context === undefined) {
    throw new Error('useVariantVisibility must be used within a VariantVisibilityProvider');
  }
  return context;
}
