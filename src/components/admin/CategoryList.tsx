'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Category } from '@/lib/categories';
import { Button } from '@/components/atoms/Button';

interface CategoryListProps {
  categories: Category[];
  activeSlug?: string;
}

export default function CategoryList({ categories, activeSlug }: CategoryListProps) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleCategoryClick = (slug: string) => {
    router.push(`/admin/products?slug=${slug}`);
  };

  return (
    <div
      className={`${collapsed ? 'w-12' : 'w-72'} bg-card border-r border-border transition-all duration-300 overflow-hidden`}
    >
      <div className="p-4 border-b border-border relative">
        {!collapsed && (
          <>
            <h2 className="text-lg font-semibold text-foreground">Categories</h2>
            <p className="text-sm text-muted-foreground mt-1">Select a category to manage products</p>
          </>
        )}
        <div className="absolute top-2 right-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand' : 'Collapse'}
            onClick={() => setCollapsed((v) => !v)}
          >
            <span className="text-lg">{collapsed ? '›' : '‹'}</span>
          </Button>
        </div>
      </div>
      {!collapsed && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {categories.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                No categories found
              </div>
            ) : (
              <div className="space-y-1">
                {categories.map((category) => {
                  const isActive = activeSlug === category.attributes.url_handle;
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryClick(category.attributes.url_handle || '')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <div className="font-medium">{category.attributes.name}</div>
                      {category.attributes.description && (
                        <div className="text-xs text-muted-foreground mt-1 truncate">
                          {category.attributes.description}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
