import { Category } from '@/lib/types/categories';
import { CategoryCard } from '../CategoryCard';
import { Card, CardHeader, CardContent, Heading } from '@/components/atoms';
import { EmptyState, LoadingCard } from '@/components/molecules';
import { ErrorMessage } from '@/components/atoms';

interface CategoriesSectionProps {
  categories: Category[];
  isLoading?: boolean;
  error?: string | null;
  title?: string;
}

export function CategoriesSection({
  categories,
  isLoading = false,
  error,
  title = 'Shop Categories'
}: CategoriesSectionProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <Heading level={2}>{title}</Heading>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <LoadingCard key={index} title="Loading categories..." height="h-48" />
            ))}
          </div>
        ) : error ? (
          <ErrorMessage message={`Failed to load categories: ${error}`} />
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Categories Found"
            description="No categories are available at the moment. Please check your SITE_URL configuration or try again later."
            action={{
              label: "Refresh",
              onClick: () => window.location.reload()
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
