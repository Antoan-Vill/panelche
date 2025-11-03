import Link from 'next/link';
import { getCategories } from '@/lib/categories';

export default async function StoreHomePage() {
  const categories = await getCategories();

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Categories</h1>
      {categories.length === 0 ? (
        <div className="text-muted-foreground">No categories available.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/store/category/${cat.attributes.url_handle ?? cat.id}`}
              className="block border border-border rounded p-4 hover:shadow"
            >
              <div className="font-medium">{cat.attributes.name}</div>
              {cat.attributes.description && (
                <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{cat.attributes.description}</div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


