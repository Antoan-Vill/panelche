'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Category } from '@/lib/categories';
import { Button } from '@/components/atoms/Button';
import { useTranslation } from '@/lib/i18n';

interface CategoryListProps {
  categories: Category[];
  activeSlug?: string;
}

export default function CategoryList({ categories, activeSlug }: CategoryListProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const handleCategoryClick = (slug: string) => {
    router.push(`/admin/catalog?slug=${slug}`);
  };
  
  // make a two dimensional list with the main categories and the subcategories
  // root categories are those with parent_id === null (ignored)
  const rootIds = new Set(categories
    .filter((category) => category.attributes.parent_id === null)
    .map((category) => category.id)
  );
  // main categories: direct children of any root id
  const hierarchicalCategories = categories.filter(
    (category) => category.attributes.parent_id !== null && rootIds.has(String(category.attributes.parent_id))
  );
  
  // If all categories are root-level (flat structure like Firestore), show them directly
  const _categories = hierarchicalCategories.length > 0 
    ? hierarchicalCategories 
    : categories.filter((category) => category.attributes.parent_id === null);


  return (
    <div
      className={`${collapsed ? 'w-12' : 'w-72'} bg-card border-r border-border transition-all duration-300 overflow-hidden`}
    >
      <div className="p-4 border-b border-border relative">
        
        <>
          <h2 className="text-lg font-semibold text-foreground">{!collapsed ? t('dashboard.categories') : <span className="opacity-0">|</span>}</h2>
        </>
        
        <div className="absolute top-2 right-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
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
                <span>{t('catalog.noCategories')}</span>
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
                        <button
                          onClick={() => handleCategoryClick(category.attributes.url_handle || '')}
                          className={`flex-1 text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            isActive
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          <div className="font-medium">{category.attributes.name} <sup className="opacity-10">({category.id?.toString() || 'something went wrong'})</sup></div>
                        </button>
                        {children.length > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                            title={isExpanded ? 'Сгъни' : 'Разгъни'}
                            onClick={toggle}
                          >
                            <span className="text-xs">{isExpanded ? '▾' : '▸'}</span>
                          </Button>
                        )}
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
                                <div>{child.attributes.name} <sup className="opacity-10">({child.id?.toString() || 'something went wrong'})</sup></div>
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
