import Link from 'next/link';
import { Category } from '@/lib/types/categories';

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link href={`/admin/catalog?slug=${category.attributes.url_handle}`} className="block">
      <div className="border border-border rounded-lg p-4 hover:bg-muted hover:border-blue-300 transition-all cursor-pointer">
        {category.attributes.image_url && (
          <img
            src={category.attributes.image_url}
            alt={category.attributes.name}
            className="w-full h-32 object-cover rounded-md mb-3"
          />
        )}
        <h4 className="font-medium text-foreground mb-2">{category.attributes.name}</h4>
        <div className="flex items-center justify-between">
          {category.attributes.url_handle && (
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              {category.attributes.url_handle}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
