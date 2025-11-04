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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const handleCategoryClick = (slug: string) => {
    router.push(`/admin/products?slug=${slug}`);
  };
  
  // make a two dimensional list with the main categories and the subcategories
  // root categories are those with parent_id === null (ignored)
  const rootIds = new Set(categories
    .filter((category) => category.attributes.parent_id === null)
    .map((category) => category.id)
  );
  // main categories: direct children of any root id
  const _categories = categories.filter(
    (category) => category.attributes.parent_id !== null && rootIds.has(String(category.attributes.parent_id))
  );


  return (
    <div
      className={`${collapsed ? 'w-12' : 'w-72'} bg-card border-r border-border transition-all duration-300 overflow-hidden`}
    >
      <div className="p-4 border-b border-border relative">
        {!collapsed && (
          <>
            <h2 className="text-lg font-semibold text-foreground">Categories</h2>
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
                {_categories.map((category) => {
                  const isActive = activeSlug === category.attributes.url_handle;
                  const children = categories.filter((c) => c.attributes.parent_id === Number(category.id));
                  const isExpanded = expanded[category.id] !== false; // default expanded
                  const toggle = () =>
                    setExpanded((prev) => ({ ...prev, [category.id]: !isExpanded }));
                  return (
                    <div key={category.id} className="space-y-1">
                      <div className="flex items-center gap-1">
                        {children.length > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                            title={isExpanded ? 'Collapse' : 'Expand'}
                            onClick={toggle}
                          >
                            <span className="text-xs">{isExpanded ? '▾' : '▸'}</span>
                          </Button>
                        )}
                        <button
                          onClick={() => handleCategoryClick(category.attributes.url_handle || '')}
                          className={`flex-1 text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            isActive
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          <div className="font-medium">{category.attributes.name}</div>
                        </button>
                      </div>
                      {isExpanded && children.length > 0 && (
                        <div className="ml-6 space-y-1">
                          {children.map((child) => {
                            const isChildActive = activeSlug === child.attributes.url_handle;
                            return (
                              <button
                                key={child.id}
                                onClick={() => handleCategoryClick(child.attributes.url_handle || '')}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                  isChildActive
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                              >
                                <div>{child.attributes.name}</div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
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
